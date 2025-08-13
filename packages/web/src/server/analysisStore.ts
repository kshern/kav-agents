import type { SupabaseClient } from "@supabase/supabase-js"; // 引入 Supabase 类型，保证类型安全

export type AnalysisEventType = "started" | "progress" | "final" | "error" | "aborted";

export interface StoredLine<T = unknown> {
  analysisId: string;
  symbol: string;
  ts: string; // ISO timestamp
  payload: { type: AnalysisEventType; event?: T } | { type: "aborted" };
}

// 已移除本地 JSONL 持久化逻辑，仅保留日志输出与 Supabase 云端存储

export async function appendEvent<T = unknown>(
  analysisId: string,
  type: AnalysisEventType,
  event?: T,
  ts: string = new Date().toISOString(),
  // 依赖 RLS，不再需要 userId
  supabase?: SupabaseClient,
) {
  // 仅记录日志，便于本地开发排查。生产仅依赖 Supabase 存储“完成态/错误态”。
  // eslint-disable-next-line no-console
  // console.log("[analysis:event]", { analysisId, symbol, type, ts, event });

  // 仅将“有效完成”的输出写入 Supabase（跳过 started 与进行中的 progress）
  // 约定：
  // - 当 type === 'final' 时视为 status='completed'
  // - 当 type === 'progress' 且 (event as any)?.status === 'completed' 时视为完成
  // - 当 type === 'error' 时视为 status='error'
  if (!supabase) return; // 未提供 Supabase，会仅做本地日志

  try {
    if (type === "final" || type === "progress" || type === "error") {
      // 从事件中提取通用字段（保持尽量稳健的类型守卫，不使用 any 直接透传）
      const e = (event as unknown) as {
        stepId?: string;
        stepText?: string;
        status?: "started" | "completed" | "error";
        progress?: number;
        result?: unknown;
        error?: unknown;
      } | undefined;

      // 仅在“完成态”或“错误态”写入 Supabase
      const isCompleted = type === "final" || (type === "progress" && e?.status === "completed");
      const isError = type === "error";
      if (!isCompleted && !isError) return; // 进行中的进度与 started 只写本地日志

      const row = {
        analysis_id: analysisId,
        // user_id 和 symbol 已从表中移除
        step_id: e?.stepId ?? (type === "final" ? "final" : type),
        step_text: e?.stepText ?? (type === "final" ? "分析完成" : undefined),
        group_key: null as unknown as string | null, // 预留：当前事件模型未提供
        round_no: 0,
        member_id: "",
        member_order: null as unknown as number | null,
        event_type: isError ? "error" : (type === "final" ? "final" : "progress"),
        status: isError ? "error" : "completed",
        progress: typeof e?.progress === "number" ? e.progress : (isError ? 0 : 100),
        ts: new Date(ts).toISOString(),
        result_json: undefined as unknown,
        result_md: undefined as unknown,
        error: undefined as unknown,
      };

      // 将 result 智能分流到 json/text，避免强制 any
      if (!isError) {
        const r = e?.result;
        if (typeof r === "string") {
          row.result_md = r;
        } else if (r !== undefined) {
          row.result_json = r as object; // 这里是类型断言：我们不生产 any，仅声明为 object
        }
      } else {
        row.error = (e?.error ?? { message: "unknown error" }) as object;
      }

      if (isError) {
        // 错误允许多条，使用 insert
        const { error: insertErr } = await supabase.from("analysis_events").insert(row).select("id").maybeSingle();
        if (insertErr) throw insertErr;
      } else {
        // 完成态使用 upsert，按 (analysis_id, step_id, round_no, member_id) 冲突覆盖
        const { error: upsertErr } = await supabase
          .from("analysis_events")
          .upsert(row, { onConflict: "analysis_id,step_id,round_no,member_id" })
          .select("id")
          .maybeSingle();
        if (upsertErr) throw upsertErr;
      }
    }
  } catch (err) {
    // 云端失败不影响主流程，打印一次日志即可
    // 真实场景可以接入告警系统
    // eslint-disable-next-line no-console
    console.error("写入 Supabase analysis_events 失败:", err);
  }
}

// 从 Supabase 读取“完成态”事件，按时间升序返回，结构兼容原先的 StoredLine
export async function readEvents<T = unknown>(
  analysisId: string,
  supabase: SupabaseClient,
): Promise<StoredLine<T>[]> {
  // 先读 Supabase 的完成事件；若失败或为空，可回退本地日志（可选）
  const out: StoredLine<T>[] = [];
  try {
    // RLS 策略已确保只能访问自己的数据，不再需要 user_id 查询条件
    // 1. 先获取会话信息，拿到 symbol
    const { data: sessionData, error: sessionError } = await supabase
      .from("analysis_sessions")
      .select("symbol")
      .eq("analysis_id", analysisId)
      .single();
    if (sessionError) throw sessionError;
    const symbol = sessionData.symbol;

    // 2. 读取所有事件
    const { data, error } = await supabase
      .from("analysis_events")
      .select(
        "analysis_id, ts, event_type, status, step_id, step_text, progress, result_json, result_md, error",
      )
      .eq("analysis_id", analysisId)
      .order("ts", { ascending: true });
    if (error) throw error;

    if (data) {
      for (const r of data) {
        const payload: { type: AnalysisEventType; event: { stepId: string; stepText?: string; status: "completed" | "error"; progress: number; result?: unknown; error?: unknown } } = {
          type: (r.event_type as AnalysisEventType) ?? "progress",
          event: {
            stepId: r.step_id as string,
            stepText: (r.step_text as string | null) ?? undefined,
            status: (r.status as "completed" | "error"),
            progress: (r.progress as number | null) ?? 0,
          },
        };
        if (r.result_md) payload.event.result = r.result_md as unknown;
        if (r.result_json) payload.event.result = r.result_json as unknown;
        if (r.error) payload.event.error = r.error as unknown;
        out.push({
          analysisId: r.analysis_id,
          symbol: symbol, // 从会话信息中获取
          ts: new Date(r.ts).toISOString(),
          payload,
        } as StoredLine<T>);
      }
    }
  } catch (e) {
    // 读取云端失败仅记录日志，不再回退本地 JSONL
    // eslint-disable-next-line no-console
    console.error("读取 Supabase analysis_events 失败:", e);
  }
  return out;
}

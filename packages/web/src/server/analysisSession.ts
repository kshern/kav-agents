import type { SupabaseClient } from "@supabase/supabase-js";

// 使用 Supabase 表存储 analysisId -> symbol 的会话映射
// 建议的表结构（请在 Supabase SQL 控制台执行一次建表/RLS 配置）：
//   create table if not exists public.analysis_sessions (
//     analysis_id text primary key,
//     symbol text not null,
//     user_id uuid not null references auth.users(id),
//     created_at timestamptz not null default now()
//   );
// 开启 RLS：
//   alter table public.analysis_sessions enable row level security;
// 策略（仅示例，按需调整）：
//   create policy "own rows insert" on public.analysis_sessions for insert with check (auth.uid() = user_id);
//   create policy "own rows select" on public.analysis_sessions for select using (auth.uid() = user_id);
//   create policy "own rows update" on public.analysis_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

// 保存/更新某个会话的 symbol（同一 analysisId 使用 upsert）
export async function saveSessionSymbol(
  supabase: SupabaseClient,
  analysisId: string,
  symbol: string,
  userId: string,
): Promise<void> {
  // 采用 upsert，保证幂等（按 analysis_id 唯一约束）
  const { error } = await supabase
    .from("analysis_sessions")
    .upsert(
      { analysis_id: analysisId, symbol, user_id: userId },
      { onConflict: "analysis_id" },
    )
    .select("analysis_id")
    .single();
  if (error) {
    // 统一向上抛出，调用方决定是否吞并
    throw new Error(`保存会话映射失败：${error.message}`);
  }
}

// 读取某个会话的 symbol（若不存在返回 undefined）
export async function readSessionSymbol(
  supabase: SupabaseClient,
  analysisId: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("analysis_sessions")
    .select("symbol")
    .eq("analysis_id", analysisId)
    .maybeSingle();
  if (error) {
    throw new Error(`读取会话映射失败：${error.message}`);
  }
  return data?.symbol ?? undefined;
}

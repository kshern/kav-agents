import { NextRequest, NextResponse } from "next/server";
import { readEvents, type StoredLine } from "@/server/analysisStore";
import { createSupabaseServerClient } from "@/server/supabase/client"; // 使用 Supabase 进行鉴权与数据读取
import { readJSONL } from "@/server/utils/jsonl";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 读取用户会话，确保仅查询本人数据（RLS 也会再次校验）
  const res = new NextResponse();
  const supabase = createSupabaseServerClient(request, res);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new NextResponse(JSON.stringify({ success: false, error: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
    });
  }
  const userId = data.user.id;

  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get("analysisId") || searchParams.get("id");
  const type = (searchParams.get("type") || "events").toLowerCase();

  if (!analysisId && type !== "list") {
    return NextResponse.json(
      { success: false, error: "analysisId is required" },
      { status: 400 },
    );
  }

  try {
    // 在非 list 分支中使用非空断言后的 id，避免 TS "string | null" 报错
    const id = analysisId as string;
    if (type === "list") {
      // 列出 data 目录下的会话（排除 .steps.jsonl）
      const { readdir, stat, readFile } = await import("node:fs/promises");
      const dir = path.resolve(process.cwd(), "data");
      const items: Array<{ analysisId: string; symbol?: string; firstTs?: string; lastTs?: string; count?: number; size?: number }> = [];
      try {
        const names = await readdir(dir);
        for (const name of names) {
          if (!name.endsWith(".jsonl")) continue;
          if (name.endsWith(".steps.jsonl")) continue;
          const analysisId = name.replace(/\.jsonl$/, "");
          const filePath = path.join(dir, name);
          let size = 0;
          try { size = (await stat(filePath)).size; } catch {}
          let symbol: string | undefined;
          let firstTs: string | undefined;
          let lastTs: string | undefined;
          let count = 0;
          try {
            const content = await readFile(filePath, { encoding: "utf-8" });
            const lines = content.split("\n").filter((l) => l.trim().length > 0);
            count = lines.length;
            if (lines.length > 0) {
              try {
                const first = JSON.parse(lines[0]);
                symbol = first.symbol as string | undefined;
                firstTs = first.ts as string | undefined;
              } catch {}
              try {
                const last = JSON.parse(lines[lines.length - 1]);
                lastTs = last.ts as string | undefined;
              } catch {}
            }
          } catch {}
          items.push({ analysisId, symbol, firstTs, lastTs, count, size });
        }
        // 按 lastTs 倒序，空值放后
        items.sort((a, b) => {
          const at = a.lastTs ? Date.parse(a.lastTs) : 0;
          const bt = b.lastTs ? Date.parse(b.lastTs) : 0;
          return bt - at;
        });
      } catch {}
      const json = NextResponse.json({ success: true, data: items }, { status: 200 });
      for (const [k, v] of res.headers) json.headers.set(k, v);
      return json;
    }

    if (type === "steps") {
      // 读取步骤级详细日志（TradeAgent.setLogFile 写入的 JSONL）
      const stepsPath = path.resolve(process.cwd(), "data", `${id}.steps.jsonl`);
      const steps = await readJSONL<unknown>(stepsPath);
      const json = NextResponse.json({ success: true, data: steps }, { status: 200 });
      for (const [k, v] of res.headers) json.headers.set(k, v);
      return json;
    }

    // 默认返回事件流缓存
    let events = await readEvents(id, supabase);
    // 若云端无记录，则回退读取本地 JSONL 缓存
    if (!events || events.length === 0) {
      const filePath = path.resolve(process.cwd(), "data", `${id}.jsonl`);
      events = await readJSONL<StoredLine>(filePath);
    }
    const json = NextResponse.json({ success: true, data: events }, { status: 200 });
    // 透传可能刷新的会话 Set-Cookie（与 stream 路由行为保持一致）
    for (const [k, v] of res.headers) json.headers.set(k, v);
    return json;
  } catch (e) {
    console.error("Failed to read cache events:", e);
    return NextResponse.json(
      { success: false, error: "Failed to read cache" },
      { status: 500 },
    );
  }
}

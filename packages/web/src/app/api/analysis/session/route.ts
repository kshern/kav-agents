export const runtime = "nodejs";
import { randomUUID } from "crypto";
import { saveSessionSymbol } from "@/server/analysisSession";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/client";

export async function POST(req: NextRequest) {
  try {
    // 鉴权：Supabase 会话
    const res = new NextResponse();
    const supabase = createSupabaseServerClient(req, res);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return new NextResponse(JSON.stringify({ success: false, error: "未登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
      });
    }
    const body = await req.json().catch(() => ({}));
    const symbol = body?.symbol as string | undefined;
    const analysisId = randomUUID();

    // 若提供了 symbol，则在本地持久化映射：analysisId -> symbol
    // 这样后续接口只需携带 analysisId 即可取回 symbol
    if (symbol) {
      try {
        await saveSessionSymbol(analysisId, symbol);
      } catch (e) {
        console.warn("保存会话 symbol 失败（不影响创建流程）:", e);
      }
    }

    return new NextResponse(JSON.stringify({ success: true, data: { analysisId, symbol } }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
    });
  } catch (e) {
    console.error("Failed to create analysis session:", e);
    return Response.json(
      { success: false, error: "Failed to create analysis session" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ success: false, error: "Method Not Allowed" }, { status: 405 });
}

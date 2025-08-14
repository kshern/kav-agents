import { NextRequest, NextResponse } from "next/server";
import { readEvents } from "@/server/analysisStore";
import { createSupabaseServerClient } from "@/server/supabase/client"; // 使用 Supabase 进行鉴权与数据读取

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

  if (!analysisId) {
    return NextResponse.json(
      { success: false, error: "analysisId is required" },
      { status: 400 },
    );
  }

  try {
    const events = await readEvents(analysisId, supabase);
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

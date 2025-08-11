import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/client";

export async function GET(req: NextRequest) {
  // 使用 NextResponse 以便在需要时刷新会话 Cookie
  const res = new NextResponse();
  const supabase = createSupabaseServerClient(req, res);
  const { data, error } = await supabase.auth.getUser();
  const user = !error ? data.user : null;
  const pub = user
    ? { id: user.id, email: user.email || "", name: (user.user_metadata as { name?: string } | null)?.name }
    : null;
  return NextResponse.json({ success: true, data: pub }, { status: 200, headers: res.headers });
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/client";

export async function POST(req: NextRequest) {
  // 使用 NextResponse 以便携带 Set-Cookie
  const res = new NextResponse();
  const supabase = createSupabaseServerClient(req, res);
  await supabase.auth.signOut();
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/client";

// 输入校验 schema
const RegisterSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  name: z.string().min(1, "名称不能为空").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const input = RegisterSchema.parse(json);

    // 用 NextResponse 携带 Set-Cookie，创建服务端 Supabase 客户端
    const res = new NextResponse();
    const supabase = createSupabaseServerClient(req, res);
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: input.name ? { name: input.name } : undefined, // 将昵称写入 user_metadata
        // 如需邮箱验证跳转，可设置 emailRedirectTo
        // emailRedirectTo: `${new URL(req.url).origin}/auth/callback`,
      },
    });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: res.headers });
    }

    // 如果项目开启邮箱验证，Supabase 不会直接返回 session，此时提示用户查收邮件
    if (!data.session || !data.user) {
      return NextResponse.json(
        { success: true, pendingVerification: true, message: "注册成功，请前往邮箱完成验证" },
        { status: 200, headers: res.headers },
      );
    }

    // 已得到会话 Cookie，返回公开用户信息
    const pub = {
      id: data.user.id,
      email: data.user.email || "",
      name: (data.user.user_metadata as { name?: string } | null)?.name,
    };
    return NextResponse.json({ success: true, data: pub }, { status: 200, headers: res.headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "注册失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

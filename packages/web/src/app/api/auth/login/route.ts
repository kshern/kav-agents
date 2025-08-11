import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/client";

// 输入校验 schema（identifier 支持邮箱或用户名）
const LoginSchema = z.object({
  identifier: z.string().min(1, "请输入邮箱或用户名"),
  password: z.string().min(6, "密码至少 6 位"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const input = LoginSchema.parse(json);

    // Supabase 目前按邮箱+密码登录；为兼容原“用户名或邮箱”输入：
    // 若 identifier 非邮箱，则提示暂仅支持邮箱登录（后续可接入 profiles 表实现用户名登录）。
    const isEmail = /@/.test(input.identifier);
    if (!isEmail) {
      return NextResponse.json(
        { success: false, error: "当前使用 Supabase 登录，暂仅支持邮箱登录" },
        { status: 400 },
      );
    }

    // 构造可承载 Set-Cookie 的响应实例，并基于其创建 Supabase 服务端客户端
    const res = new NextResponse();
    const supabase = createSupabaseServerClient(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.identifier,
      password: input.password,
    });
    if (error || !data?.user) {
      return NextResponse.json(
        { success: false, error: error?.message || "邮箱或密码错误" },
        { status: 401, headers: res.headers },
      );
    }

    // 从 Supabase 用户对象映射公开用户信息
    const pub = {
      id: data.user.id,
      email: data.user.email || "",
      name: (data.user.user_metadata as { name?: string } | null)?.name,
    };
    return NextResponse.json(
      { success: true, data: pub },
      { status: 200, headers: res.headers },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "登录失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

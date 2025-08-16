import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions, createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// 读取并校验 Supabase 环境变量
function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error("缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量");
  }
  return { url, key };
}

// 在 Route Handler 中创建服务端 Supabase 客户端，并将 cookie 写入绑定到 NextResponse
export function createSupabaseServerClient(req: NextRequest, res: NextResponse): SupabaseClient {
  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      // 从请求读取 Cookie
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      // 将 Set-Cookie 写入响应（由调用方最终 return 该响应）
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options, expires: new Date(0) });
      },
    },
  });
  return supabase as unknown as SupabaseClient;
}

// 浏览器端 Supabase 客户端（仅在需要客户端直接访问时使用）
export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key) as unknown as SupabaseClient;
}

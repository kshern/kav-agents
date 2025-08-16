import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// 中间件：保护页面与 API
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // 先构造一个可携带 Set-Cookie 的响应，用于 Supabase 在中间件中刷新会话
  const res = NextResponse.next();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    // 环境未配置时，放行（或根据需要直接 500）
    return res;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options, expires: new Date(0) });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const loggedIn = !!data?.user && !error;

  // API 访问：未登录直接 401
  if (pathname.startsWith("/api/")) {
    if (!loggedIn) {
      return new NextResponse(JSON.stringify({ success: false, error: "未登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
      });
    }
    return res;
  }

  // 页面访问：未登录重定向到登录页，并带上 from 回跳参数
  if (!loggedIn) {
    const to = new URL("/login", request.url);
    to.searchParams.set("from", `${pathname}${search}`);
    // 使用新的重定向响应，但合并已有 Set-Cookie 头
    const redirectRes = NextResponse.redirect(to);
    for (const [k, v] of res.headers) redirectRes.headers.set(k, v);
    return redirectRes;
  }

  return res;
}

// 仅拦截受限路由，减少对其它路径的影响
export const config = {
  matcher: [
    "/stock-analysis/:path*", // 受限页面
    "/api/analysis/:path*",   // 受限 API
  ],
};

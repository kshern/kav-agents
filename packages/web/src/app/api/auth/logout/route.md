# packages/web/src/app/api/auth/logout/route.ts

## 概述

- 文件职责：用户登出。调用 Supabase 的 `auth.signOut()` 注销当前会话，并通过 `NextResponse` 透传 `Set-Cookie` 清理会话。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/auth/logout`
- 运行时：默认
- 方法：POST
- 查询参数：无
- SSE：否
- 认证：无需预先登录（若存在会话将被清理）。
- 持久化：无

## 导出清单

- __函数__：`POST(req: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `@/server/supabase/client`（`createSupabaseServerClient`）

## 输入 / 输出

- 输入：`POST` 空 body；请求需携带当前会话 Cookie（若有）。
- 输出：`application/json`
  - 200：`{ success: true }`（并透传清理 Cookie 的响应头）

## 示例

```bash
curl -s -X POST 'http://localhost:3000/api/auth/logout'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.524Z
- 人工更新：2025-08-16T22:28:00+08:00

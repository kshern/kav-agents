# packages/web/src/app/api/auth/me/route.ts

## 概述

- 文件职责：返回当前登录用户的公开信息（未登录则返回 `null`）。使用 Supabase `auth.getUser()` 并通过 `NextResponse` 透传可能刷新的会话 Cookie。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/auth/me`
- 运行时：默认
- 方法：GET
- 查询参数：无
- SSE：否
- 认证：无强制校验；未登录也返回 200，`data` 为 `null`。
- 持久化：无

## 导出清单

- __函数__：`GET(req: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `@/server/supabase/client`（`createSupabaseServerClient`）

## 输入 / 输出

- 输入：`GET` 无 body；可携带 Supabase 会话 Cookie。
- 输出：`application/json`
  - 200：`{ success: true, data: { id, email, name? } | null }`（并透传 `Set-Cookie`）

## 示例

```bash
curl -s 'http://localhost:3000/api/auth/me'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.524Z
- 人工更新：2025-08-16T22:35:00+08:00

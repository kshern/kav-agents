# packages/web/src/app/api/auth/register/route.ts

## 概述

- 文件职责：处理用户注册。使用 Supabase `auth.signUp` 创建用户，会将可选的 `name` 写入 `user_metadata`；若项目开启邮箱验证，返回 `pendingVerification`。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/auth/register`
- 运行时：默认
- 方法：POST
- 查询参数：无
- SSE：否
- 认证：不要求预先登录；成功后响应头中可能包含会话 Cookie（若未启用邮箱验证）。
- 持久化：用户由 Supabase 托管。

## 导出清单

- __函数__：`POST(req: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `zod`（`email`, `password`, 可选 `name` 校验）
- `@/server/supabase/client`（`createSupabaseServerClient`）

## 输入 / 输出

- 输入：`POST` JSON Body：`{ email: string; password: string; name?: string }`
- 输出：`application/json`
  - 200：
    - 邮箱验证开启：`{ success: true, pendingVerification: true, message: "注册成功，请前往邮箱完成验证" }`
    - 否则：`{ success: true, data: { id, email, name? } }`（并透传 `Set-Cookie`）
  - 400：`{ success: false, error }`（Zod 校验错误或 Supabase signUp 错误，或 catch 分支）

## 示例

```bash
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123","name":"Alice"}' \
  'http://localhost:3000/api/auth/register'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.525Z
- 人工更新：2025-08-16T22:40:00+08:00

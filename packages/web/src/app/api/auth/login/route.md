# packages/web/src/app/api/auth/login/route.ts

## 概述

- 文件职责：处理用户登录（邮箱+密码）。使用 Supabase 完成认证，并通过 `NextResponse` 透传 `Set-Cookie` 设置会话。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/auth/login`
- 运行时：默认
- 方法：POST
- 查询参数：无
- SSE：否
- 认证：不要求预先登录；成功后在响应头设置 Supabase 会话 Cookie。
- 持久化：无

## 导出清单

- __函数__：`POST(req: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `zod`（请求体验证：`identifier`, `password`）
- `@/server/supabase/client`（`createSupabaseServerClient`）

## 输入 / 输出

- 输入：`POST` JSON Body：`{ identifier: string; password: string }`
- 规则：`identifier` 必须是邮箱（包含 `@`）。否则返回 400。
- 输出：`application/json`
  - 200：`{ success: true, data: { id, email, name? } }`（并透传 `Set-Cookie`）
  - 400：`{ success: false, error }`（Zod 校验失败或 `identifier` 不是邮箱）
  - 401：`{ success: false, error }`（Supabase 认证失败/邮箱或密码错误）

## 示例

```bash
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"user@example.com","password":"secret123"}' \
  'http://localhost:3000/api/auth/login'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.524Z
- 人工更新：2025-08-16T22:20:00+08:00

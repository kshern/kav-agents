# packages/web/src/app/api/analysis/session/route.ts

## 概述

- 文件职责：创建分析会话，返回 `analysisId`，并在提供 `symbol` 时将二者映射保存于 Supabase；GET 方法明确为 405。
- 上下文/模块：Next.js App Router API route（Node.js runtime）。

## 端点信息

- 路径：`/api/analysis/session`
- 运行时：nodejs
- 方法：
  - `POST`：创建会话。请求体 JSON 可包含 `symbol`（可选）。
  - `GET`：返回 405（Method Not Allowed）。
- 认证：使用 Supabase 校验用户，未登录时返回 401 JSON；透传可能刷新的 Set-Cookie。
- SSE：否
- 持久化：当 `POST` 传入 `symbol` 时，通过 `saveSessionSymbol()` 将 `analysisId -> symbol` 映射保存到 Supabase（失败仅告警，不影响创建）。

## 导出清单

- __常量__：`runtime: "nodejs"`
- __函数__：
  - `POST(req: NextRequest): Promise<NextResponse>`
  - `GET(): Promise<Response>`（固定返回 405）

## 主要依赖

- `crypto`（`randomUUID`）
- `@/server/analysisSession`（`saveSessionSymbol`）
- `next/server`（`NextRequest`, `NextResponse`）
- `@/server/supabase/client`（`createSupabaseServerClient`）

## 输入 / 输出

- 输入：
  - `POST`：`NextRequest`，JSON Body：`{ symbol?: string }`
  - Cookie/认证信息（Supabase 会话）
- 输出：
  - 200（POST）：`{ success: true, data: { analysisId, symbol } }`
  - 401：未登录
  - 405（GET）：`{ success: false, error: "Method Not Allowed" }`
  - 500：`{ success: false, error: "Failed to create analysis session" }`

## 示例

```bash
# 创建会话（附带登录 Cookie；symbol 可选）
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  -d '{"symbol":"AAPL"}' \
  'http://localhost:3000/api/analysis/session'

# GET 将返回 405
curl -s 'http://localhost:3000/api/analysis/session'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.522Z
- 人工更新：2025-08-16T22:07:11+08:00

# packages/web/src/app/api/analysis/stream/route.ts

## 概述

- 文件职责：验证用户会话后，启动 `TradeAgent` 的分析流程，并通过 Server-Sent Events (SSE) 持续推送步骤进度与最终结果；并将会话事件与步骤日志持久化到本地。
- 上下文/模块：Next.js App Router API route（Node.js runtime）。

## 端点信息

- 路径：`/api/analysis/stream`
- 运行时：nodejs
- 方法：GET
- 查询参数：
  - `analysisId`（必需）：唯一分析会话 ID，用于存档与追溯。
  - `symbol`（可选）：股票代码。若未提供，将通过 `readSessionSymbol()` 依据 `analysisId` 从 Supabase 会话映射读取。
- 认证：使用 Supabase 校验用户，会在未登录时返回 401 JSON：`{"success":false,"error":"未登录"}`；并透传 Supabase 可能刷新的 Set-Cookie 头。
- SSE：是（`Content-Type: text/event-stream`）
- 事件类型：`started`、`progress`、`final`、`error`、`aborted`
- 心跳：每 25s 发送一行注释 `:heartbeat` 保活

## 行为细节

- __会话校验__：
  - 通过 `createSupabaseServerClient(request, res)` 获取用户；无用户则 401。
  - 将 Supabase 返回的响应头（如 Set-Cookie）透传到 SSE 响应。
- __参数解析__：优先取 `?symbol=...`；缺失时回退 `readSessionSymbol(supabase, analysisId)`；若仍为空则 400。
- __SSE 初始化__：设置 `text/event-stream`、`no-cache`、`keep-alive` 等头；立即发送 `started` 事件，便于前端尽快渲染。
- __进度事件__：使用 `TradeAgent.onProgress()` 订阅，`event.stepId === 'final'` 归类为 `final`，其余为 `progress`；每条进度都会同步写入 JSONL 并通过 SSE 推送。
- __心跳__：`setInterval` 每 25s 发送 `:heartbeat` 注释行，避免中间设备超时断开。
- __取消__：当客户端断开（`request.signal.abort`）时，记录 `aborted` 行并关闭流；运行中止后不再推送事件。
- __错误__：运行异常时发送 `error` 事件，并写入 JSONL。

## 持久化

- __事件归档__：`data/<analysisId>.jsonl`（JSON Lines）逐行追加以下类型：`started`/`progress`/`final`/`error`/`aborted`。每行包含：`analysisId`、`symbol`、ISO 时间戳 `ts`、以及 `payload`（其中 `aborted` 仅含 `{ type }`，其他为 `{ type, event }`）。
- __步骤日志__：`TradeAgent.setLogFile("data/<analysisId>.steps.jsonl")` 记录更细粒度的步骤输入/输出/模型/记忆等。

## 导出清单

- __常量__：`runtime: "nodejs"`
- __函数__：`GET(request: NextRequest): Promise<NextResponse>` —— 返回一个携带 SSE 可读流的响应。

## 主要依赖

- 外部依赖/模块：
  - `next/server`（`NextRequest`, `NextResponse`）
  - `@core/server`（`TradeAgent`, `ProgressEvent`）
  - `@/server/analysisStore`（`appendEvent`, `StoredLine` 类型；当前仅类型与示例用途）
  - `@/server/analysisSession`（`readSessionSymbol`）
  - `@/server/supabase/client`（`createSupabaseServerClient`）
  - `@/server/utils/jsonl`（`appendJSONLSafe`）
  - `node:path`

## 输入 / 输出

- 输入：
  - `NextRequest`（包含 `URL.searchParams` 与 `signal`）
  - Cookie/认证信息（Supabase 会话）
- 输出：
  - `NextResponse<ReadableStream>`：SSE 事件流（逐行以 `data: {json}\n\n` 发送）；错误时返回 JSON 与状态码。

## 示例

```bash
# 前置：需要有效的 Supabase 会话（从浏览器调用或附带 Cookie）。

# 1) 直接连接（本地开发，已登录浏览器场景更合适）
curl -N 'http://localhost:3000/api/analysis/stream?analysisId=foo-123&symbol=AAPL'

# 2) 附带 Cookie（示例占位，实际请替换）
curl -N \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  'http://localhost:3000/api/analysis/stream?analysisId=foo-123&symbol=AAPL'

# 3) 仅提供 analysisId，服务端将回退读取会话绑定的 symbol
curl -N 'http://localhost:3000/api/analysis/stream?analysisId=foo-123'
```

```text
# SSE 示例事件（逐行）
data: {"stepId":"started","stepText":"分析开始","status":"started","progress":0}
:heartbeat
data: {"stepId":"...","status":"progress","progress":10,...}
...
data: {"stepId":"final","status":"completed","progress":100,...}
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.523Z
- 人工更新：2025-08-16T17:55:32+08:00

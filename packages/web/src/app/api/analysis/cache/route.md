# packages/web/src/app/api/analysis/cache/route.ts

## 概述

- 文件职责：读取并返回分析会话的缓存数据（事件流 JSONL、步骤日志 JSONL 或数据目录列表）。
- 上下文/模块：Next.js App Router API route（Node.js runtime）。

## 端点信息

- 路径：`/api/analysis/cache`
- 运行时：nodejs
- 方法：GET
- 查询参数：
  - `type`（可选，默认 `events`）：
    - `list`：列出 `data/` 目录下的会话文件（排除 `*.steps.jsonl`），并返回基本元数据（symbol/firstTs/lastTs/count/size），按 `lastTs` 倒序。
    - `steps`：返回步骤级详细日志，读取 `data/<analysisId>.steps.jsonl`。
    - 其他/默认 `events`：返回事件流缓存；优先从 Supabase 读取，若为空则回退本地 `data/<analysisId>.jsonl`。
  - `analysisId` 或 `id`：当 `type` 非 `list` 时必填。
- 认证：使用 Supabase 校验用户，未登录时返回 401 JSON；透传可能刷新的 Set-Cookie。
- SSE：否（普通 JSON 响应）。
- 持久化：自身不写入；仅读取 `data/<analysisId>.jsonl` 与 `data/<analysisId>.steps.jsonl`。

## 导出清单

- __常量__：`runtime: "nodejs"`
- __函数__：`GET(request: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `@/server/analysisStore`（`readEvents`, `StoredLine` 类型）
- `@/server/supabase/client`（`createSupabaseServerClient`）
- `@/server/utils/jsonl`（`readJSONL`）
- `node:fs/promises`（`readdir`, `stat`, `readFile`，仅在 `type=list` 分支动态导入）
- `node:path`

## 输入 / 输出

- 输入：`NextRequest`（含 `URL.searchParams` 与 Cookie/会话信息）
- 输出：`NextResponse`（`application/json`）：
  - 200：`{ success: true, data: ... }`
  - 400：`{ success: false, error: "analysisId is required" }`（当 `type` 非 list 且未提供 id）
  - 401：未登录
  - 500：`{ success: false, error: "Failed to read cache" }`

## 示例

```bash
# 1) 列出本地 data 目录中的会话（需登录 Cookie）
curl -s -N \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  'http://localhost:3000/api/analysis/cache?type=list'

# 2) 获取事件缓存（优先 Supabase，回退本地 JSONL）
curl -s -N \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  'http://localhost:3000/api/analysis/cache?type=events&analysisId=foo-123'

# 3) 获取步骤级日志
curl -s -N \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  'http://localhost:3000/api/analysis/cache?type=steps&analysisId=foo-123'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.521Z
- 人工更新：2025-08-16T22:07:11+08:00

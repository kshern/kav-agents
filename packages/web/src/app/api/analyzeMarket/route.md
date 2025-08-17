# packages/web/src/app/api/analyzeMarket/route.ts

## 概述

- 文件职责：市场分析 API。接收请求体，调用 `@core/server` 中的 `analyzeMarket`，返回分析结果。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/analyzeMarket`
- 运行时：默认
- 方法：POST
- 查询参数：无
- SSE：否
- 认证：无
- 持久化：无

## 导出清单

- __函数__：`POST(request: NextRequest): Promise<NextResponse>`

## 主要依赖

- `next/server`（`NextRequest`, `NextResponse`）
- `@core/server`（`analyzeMarket`）
- `@core/types`（`Model` 类型）

## 输入 / 输出

- 输入：`POST` JSON Body：
  - `company_of_interest: string`
  - `trade_date: string`
  - `modelConfig?: Model`
- 输出：`application/json`
  - 200：`{ market_report: string }`
    - 注意：核心层 `analyzeMarket` 内部若生成失败，会返回 `{ market_report: "生成市场分析报告时出错。" }`，HTTP 状态仍为 200。
  - 500：`{ error: "处理市场分析请求时出错" }`

## 示例

```bash
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"company_of_interest":"AAPL","trade_date":"2025-08-16","modelConfig":{}}' \
  'http://localhost:3000/api/analyzeMarket'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.523Z
- 人工更新：2025-08-17T00:12:59+08:00

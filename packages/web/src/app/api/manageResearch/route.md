# packages/web/src/app/api/manageResearch/route.ts

## 概述

- 文件职责：研究管理 API。接收 `investment_debate_state` 与 `modelConfig`，调用 `@core/server` 中的 `manageResearch` 返回研究结果。
- 上下文/模块：Next.js App Router API route（默认 runtime）。

## 端点信息

- 路径：`/api/manageResearch`
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
- `@core/server`（`manageResearch`, `Model`, `InvestDebateState` 类型）

## 输入 / 输出

- 输入：`POST` JSON Body：
  - `investment_debate_state: InvestDebateState`
  - `modelConfig: Model`
- 输出：`application/json`
  - 200：`{ investment_debate_state: InvestDebateState, investment_plan: string }`
    - 返回的 `investment_debate_state` 会附带 `judge_decision` 与 `current_response` 字段，值为同一份最终文本。
    - 注意：核心层 `manageResearch` 内部若生成失败，会返回上述结构，但文本为错误提示；HTTP 状态仍为 200。
  - 500：`{ error: "处理研究管理请求时出错" }`

## 示例

```bash
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"investment_debate_state":{},"modelConfig":{}}' \
  'http://localhost:3000/api/manageResearch'
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.525Z
- 人工更新：2025-08-17T00:12:59+08:00

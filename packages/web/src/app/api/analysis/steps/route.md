# packages/web/src/app/api/analysis/steps/route.ts

## 概述

- 文件职责：GET /api/analysis/steps 获取 `TradeAgent` 的分析步骤配置（静态配置，经由 `getTradeSteps()` 返回）。
- 上下文/模块：Next.js App Router API route（默认运行时，Node.js）。

## 端点信息

- 路径：`/api/analysis/steps`
- 运行时：默认（Node.js）
- 方法：GET
- 查询参数：无/未使用
- SSE: 否
- 认证：使用 Supabase，会在未登录时返回 401
- 持久化：无（仅读取内存中的静态步骤配置）

## 导出清单

- __函数__：`GET(req: NextRequest): Promise<NextResponse>`

## 主要依赖

- 外部依赖(3)：`next/server`, `@/server/supabase/client`, `@core/server`
- 本地依赖(0)：无

## 输入 / 输出

- 输入：`NextRequest`（要求已认证用户；若无会话则 401）
- 输出：`NextResponse`（`application/json`）：
  - 200：`{ success: true, data: PipelineItemConfig[] }`
  - 401：`{ success: false, error: "未登录" }`
  - 500：`{ success: false, error: "获取分析步骤配置失败" }`

### data 字段结构（摘自核心包 `TradeAgent.TRADE_STEPS`）
- 普通步骤：`{ id, text, ability, inputs?, outputs?, model?, memory? }`
- 辩论分组：`{ type: 'debate', group, rounds?, members: Array<{ id, text, ability, inputs?, outputs?, order?, model?, memory? }> }`

说明：该数组由核心包 `@core/src/agents/tradeAgent.ts` 中的静态常量 `TRADE_STEPS` 提供，`GET` 仅直接返回。

## 示例

~~~bash
# 需要有效 Supabase 会话（浏览器或附带 Cookie 调用）
curl -s -X GET \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...' \
  http://localhost:3000/api/analysis/steps
~~~

## 变更记录

- 生成时间：2025-08-16T09:43:34.522Z
- 人工更新：2025-08-16T22:25:00+08:00

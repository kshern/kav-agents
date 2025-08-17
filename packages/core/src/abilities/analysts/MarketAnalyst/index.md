# packages/core/src/abilities/analysts/MarketAnalyst/index.ts

## 概述

- 文件职责：市场分析师能力，获取行情数据，加载 `market.md` 模板并生成市场分析报告。
- 上下文/模块：隶属 `abilities/analysts/` 子系统，被 Web API 与编排层调用。

## 位置与命名

- 相对路径：`packages/core/src/abilities/analysts/MarketAnalyst/index.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function analyzeMarket

- 形态: function (async)
- 名称: analyzeMarket
- 签名: `(props: MarketAnalystProps) => Promise<{ market_report: string }>`
- 行为: 通过 `getStockData()` 获取行情；渲染模板并调用 `generateContent()` 生成 `market_report`；异常时返回回退文案。

## 主要依赖

- 外部依赖(0)：无
- 本地依赖(6)：`../../../models/gateway`（`generateContent`）、`../../../utils`（`parseAndRenderTemplate`）、`../../../utils/templateLoader`（`loadTemplate`）、`../../../dataflows/alphaVantageUtils`（`getStockData`）、`../../../types`（`MarketAnalystProps`）、`../../../pipeline/modelResolver`（`getModelConfig`）

## 输入 / 输出

- 输入：`MarketAnalystProps`
  - `company_of_interest: string`
  - `trade_date: string | number | Date`
  - `modelConfig?: Model`（可选，若未传则使用 `getModelConfig("marketAnalyst")`）
  - `memory_config?: MemoryConfig`（类型中存在，当前实现未使用）
- 输出：`Promise<{ market_report: string }>`
  - 正常：模型生成的报告文本
  - 失败回退：`"生成市场分析报告时出错。"`

## 使用示例

```ts
import { analyzeMarket } from "./index";
import type { MarketAnalystProps } from "../../../types";

const props: MarketAnalystProps = {
  company_of_interest: "AAPL",
  trade_date: "2024-12-31",
};

const { market_report } = await analyzeMarket(props);
console.log(market_report);
```

## 变更记录

- 人工更新：2025-08-17T00:46:18+08:00

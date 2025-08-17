# packages/core/src/abilities/analysts/FundamentalsAnalyst/index.ts

## 概述

- 文件职责：基本面分析师能力，加载 `fundamentals.md` 模板并调用大模型生成基本面分析报告。
- 上下文/模块：隶属 `abilities/analysts/` 子系统，被 Web API 与编排层（如 TradeAgent）调用。

## 位置与命名

- 相对路径：`packages/core/src/abilities/analysts/FundamentalsAnalyst/index.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function analyzeFundamentals

- 形态: function (async)
- 名称: analyzeFundamentals
- 签名: `(props: FundamentalsAnalystProps) => Promise<{ fundamentals_report: string }>`
- 行为: 加载与渲染模板，计算有效模型配置，调用 `generateContent()` 生成 `fundamentals_report`；异常时返回回退文案。

## 主要依赖

- 外部依赖(0)：无
- 本地依赖(5)：`../../../models/gateway`（`generateContent`）、`../../../utils`（`parseAndRenderTemplate`）、`../../../utils/templateLoader`（`loadTemplate`）、`../../../types`（`FundamentalsAnalystProps`）、`../../../pipeline/modelResolver`（`getModelConfig`）

## 输入 / 输出

- 输入：`FundamentalsAnalystProps`
  - `company_of_interest: string`
  - `trade_date: string | number | Date`
  - `modelConfig?: Model`（可选，若未传则使用 `getModelConfig("fundamentalsAnalyst")`）
  - `memory_config?: MemoryConfig`（类型中存在，当前实现未使用）
- 输出：`Promise<{ fundamentals_report: string }>`
  - 正常：模型生成的报告文本
  - 失败回退：`"生成基本面分析报告时出错。"`

## 使用示例

```ts
import { analyzeFundamentals } from "./index";
import type { FundamentalsAnalystProps } from "../../../types";

const props: FundamentalsAnalystProps = {
  company_of_interest: "AAPL",
  trade_date: "2024-12-31",
  // 可选：覆盖默认模型
  modelConfig: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
};

const { fundamentals_report } = await analyzeFundamentals(props);
console.log(fundamentals_report);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.455Z
- 人工更新：2025-08-17T00:46:18+08:00

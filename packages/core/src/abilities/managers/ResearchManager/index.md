# packages/core/src/abilities/managers/ResearchManager/index.ts

## 概述

- 文件职责：研究经理能力，整合分析报告、主持投资辩论并产出最终的 `investment_plan`。
- 上下文/模块：隶属 `abilities/managers/` 子系统，被 Web API 与编排层调用。

## 位置与命名

- 相对路径：`packages/core/src/abilities/managers/ResearchManager/index.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function manageResearch

- 形态: function (async)
- 名称: manageResearch
- 签名: `(props: { investment_debate_state: InvestDebateState; modelConfig: Model; }) => Promise<{ investment_debate_state: InvestDebateState; investment_plan: string; }>`
- 行为: 使用 `buildPastMemories()` 生成过去记忆，渲染 `research.md` 模板并通过 `generateContent()` 生成结果。将结果写入 `judge_decision` 与 `current_response`，并返回更新后的 `investment_debate_state` 与 `investment_plan`。异常时返回固定回退文案。

## 主要依赖

- 外部依赖(0)：无
- 本地依赖(6)：
  - `../../../types/agentStates`（`InvestDebateState`）
  - `../../../utils`（`parseAndRenderTemplate`）
  - `../../../models/gateway`（`generateContent`）
  - `../../../types`（`Model`）
  - `../../../adapters/memory`（`buildPastMemories`）
  - `../../../utils/templateLoader`（`loadTemplate`）

## 输入 / 输出

- 输入：`{ investment_debate_state: InvestDebateState; modelConfig: Model }`
  - `investment_debate_state`: 投资辩论状态对象（包含 `history` 等字段）
  - `modelConfig`: 模型配置
- 输出：`Promise<{ investment_debate_state: InvestDebateState; investment_plan: string }>`
  - 正常：写入 `judge_decision` 与 `current_response` 后返回更新状态与计划
  - 失败回退：`"在管理研究辩论并做出决策时出错。"`

## 使用示例

```ts
import { manageResearch } from "./index";
import type { InvestDebateState, Model } from "../../../types";

const investment_debate_state = {/* 省略：请使用业务侧真实状态 */} as InvestDebateState;
const modelConfig: Model = { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" };

const res = await manageResearch({ investment_debate_state, modelConfig });
console.log(res.investment_plan);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.482Z
- 人工更新：2025-08-17T00:46:18+08:00

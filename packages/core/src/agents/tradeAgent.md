# packages/core/src/agents/tradeAgent.ts

## 概述

- 文件职责：定义交易智能体 `TradeAgent`，基于静态流水线配置（含普通步骤与多轮辩论分组）编排各分析/研究/管理能力，生成最终交易决策。
- 上下文/模块：`agents` 业务层智能体；复用基类 `BaseAgent` 的进度事件、能力注册、步骤执行与日志设施。

## 位置与命名

- 相对路径：`packages/core/src/agents/tradeAgent.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- interface `TradeAgentInput`
  - `symbol: string`
  - `debate_rounds?: number`
  - `debate_rounds_by_group?: Record<string, number>`
  - `memory_override?: MemoryConfig`
  - `model_override?: Partial<Model>`
- class `TradeAgent extends BaseAgent<TradeAgentInput, TradeAgentOutput>`
  - 静态属性：`TRADE_STEPS: PipelineItemConfig[]`（唯一数据源）
  - 静态方法：`getTradeSteps(): PipelineItemConfig[]`
  - 公共方法：
    - `setLogFile(filePath: string): void`（设置独立 JSONL 日志文件）
    - `run(input: TradeAgentInput, options?: { signal?: AbortSignal }): Promise<TradeAgentOutput>`
  - 说明：默认记忆策略为 `situation/topK=2`，可由运行时或配置分级覆盖

## 主要依赖

- 外部依赖：无
- 本地依赖：
  - `./BaseAgent`
  - `../abilities/analysts/FundamentalsAnalyst`
  - `../abilities/analysts/MarketAnalyst`
  - `../abilities`（`analyzeNews`、`createTradePlan`、`debate*`、`manageRisk`）
  - `../abilities/managers/ResearchManager`
  - `../types`（`TradeAgentOutput`、各配置类型、`AgentState`、`Model` 等）
  - `../pipeline/executor`（`StatefulStep`）
  - `../pipeline/modelResolver`（`getModelConfig`、`mergeModelConfig`、`AbilityKey`）
  - `../utils/logger`（`FileLogger`）

## 输入 / 输出

- 输入：
  - `TradeAgentInput`（股票代码、辩论轮次覆盖、记忆/模型覆盖）
  - 可选 `options.signal` 取消信号
- 输出：
  - `Promise<TradeAgentOutput>`：步骤数组结果（聚合自流水线执行）
  - 事件：通过基类进度总线发送各步骤进度与 `final` 完成事件
  - 日志：默认输出至 `logs/trade-agent.log`；`setLogFile()` 可重定向

## 使用示例

```ts
import { TradeAgent } from "./tradeAgent";

async function main() {
  const agent = new TradeAgent();
  agent.setLogFile("data/analysis-123.jsonl"); // 可选：单次分析独立日志
  agent.onProgress((e) => {
    console.log(`[progress] ${e.stepId} ${e.status} ${e.progress ?? 0}%`);
  });

  const result = await agent.run({
    symbol: "AAPL",
    debate_rounds_by_group: { researcher_debate: 2, risk_debate: 1 },
    memory_override: { strategy: "situation", topK: 3 },
    model_override: { provider: "openai", model_name: "gpt-4o-mini" },
  });

  console.log("steps:", result.length);
}

main().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

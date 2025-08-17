# packages/core/src/memory/index.ts

## 概述

- 文件职责：提供 Memory 模块，统一管理“过去记忆”的构建与检索；并通过文件日志记录输入输出，便于排查与复盘。
- 上下文/模块：`memory` 长期记忆组件；与 `adapters/memory` 协作，供 Agent 能力在模板中注入历史摘要。

## 位置与命名

- 相对路径：`packages/core/src/memory/index.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- class `Memory`
  - 构造：初始化空记录并写入日志
  - 方法：
    - `get_memories(_current_situation: string, n_matches: number): Promise<{ recommendation: string }[]>`
    - `get_past_memories_from_history(history: { role: "human" | "ai"; content: string }[], memoryKey: string): Promise<string>`
    - `add_memory(record: { situation: string; recommendation: string; timestamp: Date }): Promise<void>`

## 主要依赖

- 外部依赖：无
- 本地依赖：`../adapters/memory`（`buildPastMemories`）、`../utils/logger`（`FileLogger`）
- 环境变量：无

## 输入 / 输出

- 输入：
  - `get_memories(situation, n)`：当前情境字符串与匹配条数
  - `get_past_memories_from_history(history, memoryKey)`：辩论历史数组与模板记忆键
  - `add_memory(record)`：包含 `situation`/`recommendation`/`timestamp` 的记录
- 输出：
  - `get_memories` 返回形如 `{ recommendation: string }[]` 的建议数组（当前为模拟数据）
  - `get_past_memories_from_history` 返回拼装后的历史摘要字符串
  - `add_memory` 无返回；副作用为写入内存数组并记录日志

## 使用示例

```ts
import { Memory } from "../memory";

async function demo() {
  const mem = new Memory();

  await mem.add_memory({
    situation: "牛熊辩论：AAPL 财报前夕高位盘整",
    recommendation: "控制仓位，等待财报指引再行加仓",
    timestamp: new Date(),
  });

  const recs = await mem.get_memories("AAPL 财报临近，板块回撤", 2);
  console.log("recs:", recs);

  const past = await mem.get_past_memories_from_history(
    [
      { role: "human", content: "请给出开场观点" },
      { role: "ai", content: "牛方：看多增长与回购；熊方：担忧估值" },
    ],
    "investment_debate_state",
  );
  console.log("past:\n", past);
}

demo().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

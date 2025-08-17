# packages/core/src/adapters/memory/index.ts
 
 
  ## 概述
 
 - 文件职责：记忆适配层，封装对 LangChain 的依赖，提供统一方法将历史消息/情境构造成“过去记忆”字符串。
 - 上下文/模块：隶属 `adapters/` 子系统，被管理器与编排层调用；日志写入运行目录下 `logs/memory.log`。
 
  ## 位置与命名
 
  - 相对路径：`packages/core/src/adapters/memory/index.ts`
  - 同名文档：同目录下同名 .md
 
  ## 导出清单
 
 ### type HistoryMessageInput
 
 - 形态: type
 - 名称: HistoryMessageInput
 - 结构: `{ role: "human" | "ai"; content: string }`
 - 用途: 适配层的通用历史消息输入，避免直接依赖业务侧消息类型。
 
 ### interface BuildPastMemoriesOptions
 
 - 形态: interface
 - 名称: BuildPastMemoriesOptions
 - 字段:
   - `strategy?: "history" | "situation"`（默认 `history`）
   - `situation?: string`（当 `strategy="situation"` 时用于相似检索的情境字符串）
   - `topK?: number`（情境检索返回条数，默认 2）
 
 ### function buildPastMemories
 
 - 形态: function (async)
 - 名称: buildPastMemories
 - 签名: `(history: HistoryMessageInput[], memoryKey: string, options?: BuildPastMemoriesOptions) => Promise<string>`
 - 行为:
   - `strategy = "situation"` 且提供 `situation` 时：使用业务记忆模块 `Memory.get_memories()` 做相似检索，拼接为编号字符串返回；记录检索日志。
   - 否则：回退到基于 `BufferMemory` 的历史摘要方案，按 `memoryKey` 读取摘要字符串返回；记录摘要日志。
 
  ## 主要依赖
 
 - 外部依赖(2)：`langchain/memory`（`BufferMemory`, `ChatMessageHistory`）、`@langchain/core/messages`（`HumanMessage`, `AIMessage`）
 - 本地依赖(2)：`../../memory`（相似检索的业务记忆模块）、`../../utils/logger`（文件日志工具）
 
  ## 输入 / 输出
 
 - 输入（针对 `buildPastMemories`）
   - `history: HistoryMessageInput[]`
   - `memoryKey: string`（需与模板占位符一致，如 `past_memories`）
   - `options?: BuildPastMemoriesOptions`
 - 输出
   - `Promise<string>`：用于模板渲染的“过去记忆”文本
 - 副作用
   - 记录文件日志：运行目录下 `logs/memory.log`（如在 Next.js 开发环境，路径为 `packages/web/logs/memory.log`）
 
  ## 使用示例
 
 ```ts
 import { buildPastMemories, type HistoryMessageInput } from "./index";
 
 const history: HistoryMessageInput[] = [
   { role: "human", content: "请总结上次的讨论要点" },
   { role: "ai", content: "上次重点讨论了现金流与负债率" },
 ];
 
 // 1) 历史摘要策略（默认）
 const past1 = await buildPastMemories(history, "past_memories");
 
 // 2) 情境相似检索策略
 const situation = [
   "market_report...",
   "sentiment_report...",
   "news_report...",
   "fundamentals_report...",
 ].join("\n\n");
 const past2 = await buildPastMemories(history, "past_memories", {
   strategy: "situation",
   situation,
   topK: 2,
 });
 
 console.log(past1, past2);
 ```
 
  ## 变更记录
 
 - 生成时间：2025-08-16T09:43:34.487Z
 - 人工更新：2025-08-17T00:46:18+08:00

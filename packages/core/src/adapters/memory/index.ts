/**
 * 记忆适配层（封装对 langchain 的依赖）
 *
 * 提供统一的方法将对话消息构造成“过去记忆”字符串，
 * 业务层只需调用本模块而不直接引用 langchain。
 */

import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Memory } from "../../memory"; // 引入业务侧记忆模块，用于情境相似检索
import { FileLogger } from "../../utils/logger"; // 文件日志工具（落地到 web/logs 下）

/**
 * 历史消息输入类型（避免在适配层中依赖业务的 DebateMessage 类型）
 */
export type HistoryMessageInput = {
  /** 角色，仅支持 human/ai */
  role: "human" | "ai";
  /** 文本内容 */
  content: string;
};

/**
 * 可选参数：支持两种构建策略
 * - history：沿用原有 BufferMemory（基于对话历史的摘要）
 * - situation：基于“当前情境字符串”的相似检索，topK 默认为 2
 */
export interface BuildPastMemoriesOptions {
  /** 构建策略，默认使用 history（保持向后兼容） */
  strategy?: "history" | "situation";
  /** 当 strategy 为 situation 时必需：四类报告拼接后的情境字符串 */
  situation?: string;
  /** 相似检索的条数，默认 2 */
  topK?: number;
}

// 记忆适配层专用日志器：日志文件位于运行时 CWD 下的 logs/memory.log
// 在 Next.js dev（packages/web）下运行时，CWD=packages/web，因此会写入 packages/web/logs/memory.log
const memLogger = new FileLogger("logs/memory.log");

/**
 * 适配层暴露的能力：根据输入消息构造统一的“过去记忆”字符串
 *
 * @param history - 辩论历史消息输入数组
 * @param memoryKey - 业务定义的内存键（需要与模板占位符一致）
 * @returns 过去记忆字符串（通常用于模板中的 past_memories 或类似占位符）
 */
export async function buildPastMemories(
  history: HistoryMessageInput[],
  memoryKey: string,
  options?: BuildPastMemoriesOptions,
): Promise<string> {
  const strategy = options?.strategy ?? "history";

  // 分支一：基于“情境”的相似检索（对齐 Python 行为：四报告情境 + topK=2）
  if (strategy === "situation") {
    const situation = (options?.situation || "").trim();
    const topK = options?.topK ?? 2;
    if (!situation) {
      // 若未提供情境，回退到 history 策略，避免返回空
      // （也可选择直接返回空字符串）
      await memLogger.info("MemoryAdapter", "情境检索缺失，回退到 history", {
        memoryKey,
        strategy,
        situation_length: 0,
        topK,
        history_count: (history || []).length,
      });
    } else {
      const mem = new Memory();
      // 记录检索输入
      await memLogger.info("MemoryAdapter", "情境检索-开始", {
        memoryKey,
        strategy,
        situation_length: situation.length,
        situation_preview: situation.slice(0, 200), // 中文注释：仅预览前 200 字，避免日志过大
        topK,
        history_count: (history || []).length,
      });
      const recs = await mem.get_memories(situation, topK);
      const past = (recs || [])
        .map((r, idx) => `(${idx + 1}) ${r.recommendation}`)
        .join("\n");
      // 记录检索结果
      await memLogger.info("MemoryAdapter", "情境检索-完成", {
        memoryKey,
        strategy,
        topK,
        recs_count: (recs || []).length,
        past_length: past.length,
        past_preview: past.slice(0, 200),
      });
      return past;
    }
  }

  // 分支二：基于对话历史的 BufferMemory（保持与原实现一致）
  // 将通用消息输入转换为 LangChain 所需的消息对象
  const lcMessages = (history || []).map((m) => {
    return m.role === "human"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content);
  });
  const lcHistory = new ChatMessageHistory(lcMessages);

  const memory = new BufferMemory({
    chatHistory: lcHistory,
    memoryKey,
    returnMessages: false,
  });
  // 记录历史摘要策略输入
  await memLogger.info("MemoryAdapter", "历史检索-开始", {
    memoryKey,
    strategy: "history",
    history_count: (history || []).length,
  });
  const memoryVariables = await memory.loadMemoryVariables({});
  const past = memoryVariables[memoryKey as keyof typeof memoryVariables];
  const pastStr = typeof past === "string" ? past : String(past ?? "");
  // 记录历史摘要策略结果
  await memLogger.info("MemoryAdapter", "历史检索-完成", {
    memoryKey,
    strategy: "history",
    past_length: pastStr.length,
    past_preview: pastStr.slice(0, 200),
  });
  return pastStr;
}

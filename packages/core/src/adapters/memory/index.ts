/**
 * 记忆适配层（封装对 langchain 的依赖）
 *
 * 提供统一的方法将对话消息构造成“过去记忆”字符串，
 * 业务层只需调用本模块而不直接引用 langchain。
 */

import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

/**
 * 基础聊天消息输入类型（避免在适配层中依赖业务的 DebateMessage 类型）
 */
export type ChatMessageInput = {
  /** 角色，仅支持 human/ai */
  role: "human" | "ai";
  /** 文本内容 */
  content: string;
};

/**
 * 适配层暴露的能力：根据输入消息构造统一的“过去记忆”字符串
 *
 * @param messages - 聊天消息输入数组
 * @param memoryKey - 业务定义的内存键（需要与模板占位符一致）
 * @returns 过去记忆字符串（通常用于模板中的 past_memories 或类似占位符）
 */
export async function buildPastMemories(
  messages: ChatMessageInput[],
  memoryKey: string
): Promise<string> {
  // 将通用消息输入转换为 LangChain 所需的消息对象
  const lcMessages = messages.map((m) => {
    return m.role === "human"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content);
  });

  // 构建 LangChain 的消息历史
  const history = new ChatMessageHistory(lcMessages);

  // 使用 BufferMemory 生成过去记忆字符串
  const memory = new BufferMemory({
    chatHistory: history,
    memoryKey, // 不在适配层硬编码，由业务传入以与模板占位符保持一致
    returnMessages: false, // 返回字符串而不是消息对象数组
  });

  const memoryVariables = await memory.loadMemoryVariables({});
  // 这里按约定读取同名的 key
  const past = memoryVariables[memoryKey as keyof typeof memoryVariables];

  // 类型保护：确保返回字符串
  return typeof past === "string" ? past : String(past ?? "");
}

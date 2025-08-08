/**
 * @file 研究经理 Agent
 * @description 定义了用于管理研究流程、主持辩论并制定投资计划的函数。
 */

import { InvestDebateState, DebateMessage } from "../../../types/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import researchTemplate from "./research.md?raw";
import { generateContent } from "../../../models/gateway";
import { Model } from "../../../types";
import { buildPastMemories } from "../../../adapters/memory";
import type { ChatMessageInput } from "../../../adapters/memory";

/**
 * 整合所有分析报告，评估投资辩论，并生成最终的投资计划。
 *
 * @param props - 包含当前投资辩论状态的对象。
 * @returns - 返回一个包含更新后辩论状态和投资计划的对象。
 */
export async function manageResearch(props: {
  investment_debate_state: InvestDebateState;
  modelConfig: Model;
}): Promise<{
  investment_debate_state: InvestDebateState;
  investment_plan: string;
}> {
  const { investment_debate_state, modelConfig } = props;
  // 业务侧定义 memoryKey，需与模板占位符保持一致
  const memoryKey = "past_memories";

  // 使用适配层将 history 构造成过去记忆字符串，业务不直接依赖 langchain
  const messages: ChatMessageInput[] = (
    investment_debate_state.history || []
  ).map((message: DebateMessage) => ({
    role: message.role === "human" ? "human" : "ai",
    content: message.content,
  }));
  const pastMemories = await buildPastMemories(messages, memoryKey);

  const prompt = parseAndRenderTemplate(researchTemplate, {
    past_memories: pastMemories, // LangChain memory 的输出
    debate_history: pastMemories, // 同样使用 memory 的输出
  });

  try {
    const result = await generateContent({
      modelConfig,
      prompt,
    });

    const newInvestDebateState: InvestDebateState = {
      ...investment_debate_state,
      judge_decision: result,
      current_response: result,
    };

    return {
      investment_debate_state: newInvestDebateState,
      investment_plan: result,
    };
  } catch (error) {
    console.error("Error managing research debate:", error);
    const decision = "在管理研究辩论并做出决策时出错。";
    return {
      investment_debate_state: {
        ...investment_debate_state,
        judge_decision: decision,
        current_response: decision,
      },
      investment_plan: decision,
    };
  }
}

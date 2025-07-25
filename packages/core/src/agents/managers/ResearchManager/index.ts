/**
 * @file 研究经理 Agent
 * @description 定义了用于管理研究流程、主持辩论并制定投资计划的函数。
 */

import { InvestDebateState, DebateMessage } from "../../../models/agentStates";
import { fillPromptTemplate } from "../../utils";
import researchTemplate from "./research.md?raw";
import { generateContent } from "../../utils/geminiUtils";
import { Model } from "../../../types";
import {
  BufferMemory,
  ChatMessageHistory,
} from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

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

  // 从 investment_debate_state.history 构建 ChatMessageHistory
  const history = new ChatMessageHistory(
    (investment_debate_state.history || []).map((message: DebateMessage) => {
      if (message.role === "human") {
        return new HumanMessage(message.content);
      } else {
        return new AIMessage(message.content);
      }
    })
  );

  // 创建 BufferMemory 实例
  const memory = new BufferMemory({
    chatHistory: history,
    memoryKey: "past_memories", // 确保这个 key 和 prompt 模板中的占位符一致
    returnMessages: false, // 设置为 false, `loadMemoryVariables` 会返回字符串
  });

  // 加载内存变量
  const memoryVariables = await memory.loadMemoryVariables({});
  const pastMemories = memoryVariables.past_memories;

  const prompt = fillPromptTemplate(researchTemplate, {
    past_memories: pastMemories, // LangChain memory 的输出
    debate_history: pastMemories, // 同样使用 memory 的输出
  });

  try {
    const result = await generateContent({
      modelConfig,
      prompt
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

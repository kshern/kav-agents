/**
 * @file 研究经理 Agent
 * @description 定义了用于管理研究流程、主持辩论并制定投资计划的函数。
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvestDebateState } from "../../../models/agentStates";
import { fillPromptTemplate } from "../../utils";
import researchTemplate from "./research.md?raw";
import { generateContent } from "../../utils/geminiUtils";

/**
 * 整合所有分析报告，评估投资辩论，并生成最终的投资计划。
 *
 * @param props - 包含当前投资辩论状态的对象。
 * @returns - 返回一个包含更新后辩论状态和投资计划的对象。
 */
export async function manageResearch(props: {
  investment_debate_state: InvestDebateState;
}): Promise<{
  investment_debate_state: InvestDebateState;
  investment_plan: string;
}> {
  const { investment_debate_state } = props;

  // 模拟从内存中获取过去的决策反思
  // 在实际应用中，需要实现从内存中检索的逻辑
  const pastMemories = ""; // 此处应为 memory.getMemories(...) 的实现

  const prompt = fillPromptTemplate(researchTemplate, {
    past_memories: pastMemories,
    debate_history: investment_debate_state.history,
  });

  try {
    const result = await generateContent({
      modelName: "gemini-2.5-flash",
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

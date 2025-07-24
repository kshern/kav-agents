/**
 * @file 牛方研究员 Agent
 * @description 定义了在投资辩论中持看涨观点的函数。
 */

import { AgentState } from "../../../models/agentStates";
import { fillPromptTemplate } from "../../utils";
import bullTemplate from "./bull.md?raw";
import { generateContent } from "../../utils/geminiUtils";

/**
 * 基于所有分析报告，从看涨的角度生成投资论点。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回包含牛方论点的对象。
 */
export async function researchBull(
  state: AgentState
): Promise<{ bull_argument: string }> {
  const prompt = fillPromptTemplate(bullTemplate, {
    history: state.investment_debate_state.history,
    market_report: state.market_report,
    sentiment_report: state.sentiment_report,
    news_report: state.news_report,
    fundamentals_report: state.fundamentals_report,
  });

  try {
    const result = await generateContent({
      modelName: "gemini-2.5-flash",
      prompt
    });
    return { bull_argument: result };
  } catch (error) {
    console.error("Error generating bull researcher argument:", error);
    return { bull_argument: "生成牛方论点时出错。" };
  }
}

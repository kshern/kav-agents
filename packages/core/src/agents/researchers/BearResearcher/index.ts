/**
 * @file 熊方研究员 Agent
 * @description 定义了在投资辩论中持看跌观点的函数。
 */

import { AgentState } from "../../../models/agentStates";
import { fillPromptTemplate } from "../../utils";
import bearTemplate from "./bear.md?raw";
import { generateContent } from "../../utils/geminiUtils";

/**
 * 基于所有分析报告，从看跌的角度生成投资论点。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回包含熊方论点的对象。
 */
export async function researchBear(
  state: AgentState
): Promise<{ bear_argument: string }> {
  const prompt = fillPromptTemplate(bearTemplate, {
    history: state.investment_debate_state.history,
    market_report: state.market_report,
    sentiment_report: state.sentiment_report,
    news_report: state.news_report,
    fundamentals_report: state.fundamentals_report,
  });

  try {
    const result = await generateContent({
      modelName: "gemini-2.5-flash",
      prompt,
    });
    return { bear_argument: result };
  } catch (error) {
    console.error("Error generating bear researcher argument:", error);
    return { bear_argument: "生成熊方论点时出错。" };
  }
}

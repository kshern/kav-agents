/**
 * @file 保守派辩手 Agent
 * @description 定义了在风险管理辩论中持保守观点的函数。
 */

import { AgentState } from '../../../models/agentStates';
import { fillPromptTemplate } from '../../../utils';
import conservativeTemplate from './conservative.md?raw';
import { generateContent } from "../../../utils/geminiUtils";

/**
 * 基于初步投资计划和所有分析报告，从保守的角度生成风险评估论点。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回包含保守派论点的对象。
 */
export async function debateConservative(state: AgentState): Promise<{conservative_argument: string}> {
  const prompt = fillPromptTemplate(conservativeTemplate, {
    investment_plan: state.investment_plan,
    risk_debate_history: state.risk_debate_state.history,
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
    return { conservative_argument: result };
  } catch (error) {
    console.error("Error generating conservative debator argument:", error);
    return { conservative_argument: "生成保守派论点时出错。" };
  }
}

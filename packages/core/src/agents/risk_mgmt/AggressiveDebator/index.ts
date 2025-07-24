/**
 * @file 激进派辩手 Agent
 * @description 定义了在风险管理辩论中持激进观点的函数。
 */

import { AgentState } from '../../../models/agentStates';
import { fillPromptTemplate } from '../../utils';
import aggressiveTemplate from './aggressive.md?raw';
import { generateContent } from "../../utils/geminiUtils";

/**
 * 基于初步投资计划和所有分析报告，从激进的角度生成风险评估论点。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回包含激进派论点的对象。
 */
export async function debateAggressive(state: AgentState): Promise<{aggressive_argument: string}> {
  const prompt = fillPromptTemplate(aggressiveTemplate, {
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
    return { aggressive_argument: result };
  } catch (error) {
    console.error("Error generating aggressive debator argument:", error);
    return { aggressive_argument: "生成激进派论点时出错。" };
  }
}

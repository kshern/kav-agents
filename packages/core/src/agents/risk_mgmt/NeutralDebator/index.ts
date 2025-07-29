/**
 * @file 中立派辩手 Agent
 * @description 定义了在风险管理辩论中持中立观点的函数。
 */

import { AgentState } from '../../../models/agentStates';
import { fillPromptTemplate } from '../../../utils';
import { generateContent } from '../../../utils/geminiUtils';
import neutralTemplate from './neutral.md?raw';


/**
 * 基于初步投资计划和所有分析报告，从风险中立的角度生成评估论点。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回包含中立派论点的对象。
 */
export async function debateNeutral(state: AgentState): Promise<{neutral_argument: string}> {
  const prompt = fillPromptTemplate(neutralTemplate, {
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
    return { neutral_argument: result };
  } catch (error) {
    console.error("Error generating neutral debator argument:", error);
    return { neutral_argument: "生成中立派论点时出错。" };
  }
}

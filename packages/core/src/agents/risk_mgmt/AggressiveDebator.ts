/**
 * @file 激进派辩手 Agent
 * @description 定义了在风险管理辩论中持激进观点的 AggressiveDebator 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';

/**
 * @class AggressiveDebator
 * @description 一个在风险管理辩论中扮演激进派角色的 Agent。
 */
export class AggressiveDebator {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 基于初步投资计划和所有分析报告，从激进的角度生成风险评估论点。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回包含激进派论点的字符串。
   */
  async debate(state: AgentState): Promise<string> {
    const { 
      investment_plan,
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      risk_debate_state
    } = state;

    const prompt = `
      你是一名风险分析师，在辩论中扮演“激进派”的角色。你的任务是审查初步的投资计划以及所有的研究报告，并提出一个支持更高风险、更高潜在回报的论点。
      寻找可以放大收益的机会，挑战过于保守的假设，并强调潜在的、未被充分重视的上涨空间。

      初步投资计划：
      ${investment_plan}

      辩论历史：
      ${risk_debate_state.history}

      研究报告摘要：
      - 市场报告：${market_report}
      - 情绪报告：${sentiment_report}
      - 新闻报告：${news_report}
      - 基本面报告：${fundamentals_report}

      请根据以上信息，提出你的下一个论点，倡导一个更激进的交易策略。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating aggressive debator argument:', error);
      return '生成激进派论点时出错。';
    }
  }
}

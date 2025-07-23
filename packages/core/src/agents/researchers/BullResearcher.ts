/**
 * @file 牛方研究员 Agent
 * @description 定义了在投资辩论中持看涨观点的 BullResearcher 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';

/**
 * @class BullResearcher
 * @description 一个在投资辩论中扮演牛方角色的 Agent，提出看涨论据。
 */
export class BullResearcher {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 基于所有分析报告，从看涨的角度生成投资论点。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回包含牛方论点的字符串。
   */
  async research(state: AgentState): Promise<string> {
    const { 
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      investment_debate_state
    } = state;

    const prompt = `
      你是一名投资分析师，在辩论中扮演“牛方”的角色。你的任务是基于以下所有研究报告，提出一个令人信服的“买入”建议。
      请综合利用市场分析、新闻、社交媒体情绪和基本面数据来支持你的看涨立场。
      你的论点需要有说服力、数据驱动，并直接反驳任何潜在的负面观点。

      辩论历史：
      ${investment_debate_state.history}

      研究报告摘要：
      - 市场报告：${market_report}
      - 情绪报告：${sentiment_report}
      - 新闻报告：${news_report}
      - 基本面报告：${fundamentals_report}

      请根据以上信息，提出你的下一个论点，强化你的“买入”立场。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating bull researcher argument:', error);
      return '生成牛方论点时出错。';
    }
  }
}

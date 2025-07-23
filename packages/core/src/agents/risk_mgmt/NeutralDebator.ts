/**
 * @file 中立派辩手 Agent
 * @description 定义了在风险管理辩论中持中立观点的 NeutralDebator 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';

/**
 * @class NeutralDebator
 * @description 一个在风险管理辩论中扮演中立派角色的 Agent。
 */
export class NeutralDebator {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 基于初步投资计划和所有分析报告，从风险中立的角度生成评估论点。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回包含中立派论点的字符串。
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
      你是一名风险分析师，在辩论中扮演“中立派”的角色。你的任务是客观地审查初步的投资计划以及所有的研究报告，并提供一个平衡风险与回报的视角。
      清晰地权衡激进策略的潜在收益和保守策略的安全保障。你的目标是提供一个不偏不倚的评估，帮助团队做出最明智的决策。

      初步投资计划：
      ${investment_plan}

      辩论历史：
      ${risk_debate_state.history}

      研究报告摘要：
      - 市场报告：${market_report}
      - 情绪报告：${sentiment_report}
      - 新闻报告：${news_report}
      - 基本面报告：${fundamentals_report}

      请根据以上信息，提出你的下一个论点，提供一个平衡的、风险中立的评估。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating neutral debator argument:', error);
      return '生成中立派论点时出错。';
    }
  }
}

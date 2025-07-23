/**
 * @file 交易员 Agent
 * @description 定义了根据最终投资计划制定具体交易提案的 Trader 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';
import { Memory } from '../utils/memory';

/**
 * @class Trader
 * @description 一个根据最终投资计划制定具体交易提案的 Agent。
 */
export class Trader {
  private model: GenerativeModel;
  private memory: Memory;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   * @param memory - 一个 Memory 实例，用于存储和检索历史记忆。
   */
  constructor(model: GenerativeModel, memory: Memory) {
    this.model = model;
    this.memory = memory;
  }

  /**
   * 基于最终的投资计划和所有分析，生成一个明确的交易提案。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回一个包含最终交易计划的对象。
   */
  async trade(state: AgentState): Promise<{ trader_investment_plan: string }> {
    const {
      company_of_interest,
      investment_plan,
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report
    } = state;

    const currentSituation = `${market_report}\n\n${sentiment_report}\n\n${news_report}\n\n${fundamentals_report}`;
    const pastMemories = ""; // this.memory.getMemories(currentSituation, 2);

    const prompt = `
      你是一名交易员，负责分析市场数据并做出投资决策。根据你的分析，提供一个具体的买入、卖出或持有建议。
      请以坚定的决策结束，并始终以“FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL**”来结束你的回应，以确认你的建议。
      不要忘记利用过去决策的教训来从错误中学习。

      以下是你在类似交易情况下的反思和学到的教训：
      ${pastMemories}

      基于分析师团队的综合分析，这里是为 ${company_of_interest} 量身定制的投资计划。
      该计划结合了当前技术市场趋势、宏观经济指标和社交媒体情绪的见解。
      请将此计划作为评估你下一个交易决策的基础。

      建议的投资计划：
      ${investment_plan}

      利用这些见解，做出一个明智的、战略性的决策。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const decision = response.text();

      return { trader_investment_plan: decision };
    } catch (error) {
      console.error('Error generating trader plan:', error);
      return { trader_investment_plan: '生成交易员计划时出错。' };
    }
  }
}
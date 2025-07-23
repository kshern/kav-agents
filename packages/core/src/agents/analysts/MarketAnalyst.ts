/**
 * @file 市场分析师 Agent
 * @description 定义了用于分析股票市场数据的 MarketAnalyst 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';
import { YFinanceUtils } from '../../dataflows/yfinUtils';

/**
 * @class MarketAnalyst
 * @description 一个分析股票市场数据的 Agent。
 */
export class MarketAnalyst {
  private model: GenerativeModel;
  private yfin: YFinanceUtils;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
    this.yfin = new YFinanceUtils();
  }

  /**
   * 分析给定公司的市场数据并生成报告。
   *
   * @param state - 当前的 Agent 状态，包含公司代码和交易日期。
   * @returns - 返回一个包含市场分析报告的对象。
   */
  async analyze(state: AgentState): Promise<{ market_report: string }> {
    const { company_of_interest, trade_date } = state;

    try {
      // 1. 获取原始数据
      const stockData = await this.yfin.getStockData(company_of_interest, '2024-01-01', trade_date); // 日期需要动态调整
      const stockInfo = await this.yfin.getStockInfo(company_of_interest);
      const recommendations = await this.yfin.getAnalystRecommendations(company_of_interest);

      // 2. 构建提示
      const prompt = `
        你是一名研究员，任务是分析一家公司的市场信息。请撰写一份关于该公司市场信息的综合报告，
        包括股价走势、交易量、分析师评级等，以全面了解公司的市场表现，为交易员提供参考。
        请确保包含尽可能多的细节和精细的分析。
        在报告末尾附加一个 Markdown 表格来整理关键点。

        参考数据如下：
        - 公司：${company_of_interest}
        - 当前日期：${trade_date}
        - 股票信息：${JSON.stringify(stockInfo, null, 2)}
        - 分析师建议：${JSON.stringify(recommendations, null, 2)}
        - 近期股价历史：${JSON.stringify(stockData.slice(-10), null, 2)} (仅展示最近10条)
      `;

      // 3. 调用模型生成报告
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const report = response.text();

      return { market_report: report };
    } catch (error) {
      console.error('Error generating market report:', error);
      return { market_report: '生成市场分析报告时出错。' };
    }
  }
}

/**
 * @file 基本面分析师 Agent
 * @description 定义了用于分析公司基本面信息的 FundamentalsAnalyst 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';

/**
 * @class FundamentalsAnalyst
 * @description 一个分析公司基本面信息的 Agent。
 */
export class FundamentalsAnalyst {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 分析给定公司的基本面信息并生成报告。
   *
   * @param state - 当前的 Agent 状态，包含公司代码和交易日期。
   * @returns - 返回一个包含分析报告的对象。
   */
  async analyze(state: AgentState): Promise<{ fundamentals_report: string }> {
    const { company_of_interest, trade_date } = state;

    const prompt = `
      你是一名研究员，任务是分析一家公司在过去一周的基本面信息。
      请撰写一份关于该公司基本面信息的综合报告，例如财务文件、公司简介、基本财务状况、公司财务历史、内部人士情绪和内部人士交易，以全面了解公司的基本面信息，为交易员提供参考。
      请确保包含尽可能多的细节。不要简单地说趋势好坏参半，要提供详细、精细的分析和见解，以帮助交易员做出决策。
      请在报告末尾附加一个 Markdown 表格，以整理报告中的要点，使其易于阅读。

      为你提供参考，当前日期是 ${trade_date}。我们要关注的公司是 ${company_of_interest}。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const report = response.text();
      
      return { fundamentals_report: report };
    } catch (error) {
      console.error('Error generating fundamentals report:', error);
      return { fundamentals_report: '生成基本面分析报告时出错。' };
    }
  }
}

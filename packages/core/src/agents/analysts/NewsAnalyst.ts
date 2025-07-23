/**
 * @file 新闻分析师 Agent
 * @description 定义了用于分析和总结新闻的 NewsAnalyst 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';
import { getNewsData, NewsArticle } from '../../dataflows/googleNewsUtils';

/**
 * @class NewsAnalyst
 * @description 一个分析和总结新闻的 Agent。
 */
export class NewsAnalyst {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 获取并分析给定公司的新闻，然后生成报告。
   * @param state - 当前的 Agent 状态，包含公司代码和交易日期。
   * @returns - 返回一个包含新闻分析报告的对象。
   */
  async analyze(state: AgentState): Promise<{ news_report: string }> {
    const { company_of_interest, trade_date } = state;

    try {
      // 1. 获取新闻数据
      const newsArticles = await getNewsData(company_of_interest, '2024-01-01', trade_date); // 日期需要动态调整

      if (newsArticles.length === 0) {
        return { news_report: '未找到相关新闻。' };
      }

      // 2. 构建提示
      const prompt = `
        你是一名研究员，任务是分析与一家公司相关的新闻。请根据以下新闻文章，撰写一份关于该公司的新闻摘要报告。
        报告应总结关键事件、市场情绪和潜在影响，为交易员提供参考。
        请确保包含尽可能多的细节和精细的分析。
        在报告末尾附加一个 Markdown 表格来整理关键新闻点。

        参考新闻文章如下 (最多展示10条)：
        ${newsArticles.slice(0, 10).map(article => `
          - 标题: ${article.title}
          - 来源: ${article.source}
          - 日期: ${article.date}
          - 摘要: ${article.snippet}
          - 链接: ${article.link}
        `).join('\n')}
      `;

      // 3. 调用模型生成报告
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const report = response.text();

      return { news_report: report };
    } catch (error) {
      console.error('Error generating news report:', error);
      return { news_report: '生成新闻分析报告时出错。' };
    }
  }
}

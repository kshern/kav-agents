/**
 * @file 社交媒体分析师 Agent
 * @description 定义了用于分析社交媒体情绪的 SocialMediaAnalyst 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState } from '../../models/agentStates';
import { fetchTopFromCategory, RedditPost } from '../../dataflows/redditUtils';

/**
 * @class SocialMediaAnalyst
 * @description 一个分析社交媒体情绪的 Agent。
 */
export class SocialMediaAnalyst {
  private model: GenerativeModel;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   */
  constructor(model: GenerativeModel) {
    this.model = model;
  }

  /**
   * 获取并分析给定公司的社交媒体帖子，然后生成报告。
   *
   * @param state - 当前的 Agent 状态，包含公司代码和交易日期。
   * @returns - 返回一个包含社交媒体情绪报告的对象。
   */
  async analyze(state: AgentState): Promise<{ sentiment_report: string }> {
    const { company_of_interest, trade_date } = state;

    try {
      // 1. 获取 Reddit 数据
      const redditPosts = await fetchTopFromCategory('company_news', trade_date, 20, company_of_interest, 'reddit_data');

      if (redditPosts.length === 0) {
        return { sentiment_report: '未找到相关的社交媒体帖子。' };
      }

      // 2. 构建提示
      const prompt = `
        你是一名研究员，任务是分析与一家公司相关的社交媒体讨论。请根据以下 Reddit 帖子，撰写一份关于该公司社交媒体情绪的摘要报告。
        报告应总结讨论的主要话题、普遍情绪（正面/负面/中立）以及任何可能影响股价的见解，为交易员提供参考。
        请确保包含尽可能多的细节和精细的分析。
        在报告末尾附加一个 Markdown 表格来整理关键的讨论点和情绪。

        参考 Reddit 帖子如下 (最多展示10条)：
        ${redditPosts.slice(0, 10).map(post => `
          - 标题: ${post.title}
          - 内容: ${post.content.substring(0, 200)}...
          - 赞数: ${post.upvotes}
          - 链接: ${post.url}
        `).join('\n')}
      `;

      // 3. 调用模型生成报告
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const report = response.text();

      return { sentiment_report: report };
    } catch (error) {
      console.error('Error generating sentiment report:', error);
      return { sentiment_report: '生成社交媒体情绪报告时出错。' };
    }
  }
}

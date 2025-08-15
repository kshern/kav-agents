/**
 * @file 新闻分析师 Agent
 * @description 定义了用于分析和总结新闻的函数。
 */

import { getNewsFromApi } from "../../../dataflows/newsApiUtils";
import { parseAndRenderTemplate } from "../../../utils";
import { NewsAnalystProps, NewsArticle } from "../../../types";
import { loadTemplate } from "../../../utils/templateLoader"; // 动态加载模板，兼容Vite和Node环境
import { generateContent } from "../../../models/gateway";
import { getModelConfig } from "../../../config/models"; // 集中式模型配置

// 提示：Vite 环境可通过 '?raw' 直接引入模板；这里统一用 loadTemplate 动态加载，无需本地 modelConfig

/**
 * 格式化新闻文章列表为字符串。
 * @param articles - 新闻文章对象数组。
 * @returns - 格式化后的字符串。
 */
function formatNewsArticles(articles: NewsArticle[]): string {
  return articles
    .slice(0, 10) // 最多展示10条
    .map(
      (article) => `
      - 标题: ${article.title}
      - 来源: ${article.source}
      - 日期: ${article.date}
      - 摘要: ${article.snippet}
      - 链接: ${article.link}
    `,
    )
    .join("\n");
}

/**
 * 获取并分析给定公司的新闻，然后生成报告。
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含新闻分析报告的对象。
 */
export async function analyzeNews(
  props: NewsAnalystProps,
): Promise<{ news_report: string }> {
  const { company_of_interest, trade_date, modelConfig } = props; // 支持注入模型配置

  try {
    // 1. 获取新闻数据
    // NewsAPI.org 免费版仅支持查询过去一个月的新闻
    // 因此，我们将起始日期设置为 trade_date 的前28天
    const toDate = new Date(trade_date);
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - 28);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const newsArticles = await getNewsFromApi(
      String(company_of_interest),
      formatDate(fromDate),
      formatDate(toDate),
    );

    if (newsArticles.length === 0) {
      return { news_report: "未找到相关新闻。" };
    }

    // 2. 格式化新闻并构建提示
    const formattedNews = formatNewsArticles(newsArticles);
    // 动态加载新闻分析模板
    const template = await loadTemplate("news.md", import.meta.url);
    const prompt = parseAndRenderTemplate(template, {
      news_articles: formattedNews,
    }); // 用统一工具渲染模板

    // 3. 计算有效模型并生成报告（优先使用注入，其次回退到集中默认）
    const effectiveModel = modelConfig ?? getModelConfig("newsAnalyst");
    const result = await generateContent({
      modelConfig: effectiveModel,
      prompt,
    });

    return { news_report: result };
  } catch (error) {
    console.error("Error generating news report:", error);
    return { news_report: "生成新闻分析报告时出错。" };
  }
}

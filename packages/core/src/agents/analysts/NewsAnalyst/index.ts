/**
 * @file 新闻分析师 Agent
 * @description 定义了用于分析和总结新闻的函数。
 */

import { getNewsFromApi } from "../../../dataflows/newsApiUtils";
import { fillPromptTemplate } from "../../utils";
import { Model, NewsArticle } from "../../../types";
import newsTemplate from "./news.md?raw";
import { generateContent } from "../../utils/geminiUtils";

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
    `
    )
    .join("\n");
}

/**
 * 获取并分析给定公司的新闻，然后生成报告。
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含新闻分析报告的对象。
 */
export async function analyzeNews(props: {
  company_of_interest: string;
  modelConfig: Model;
  trade_date: string;
}): Promise<{ news_report: string }> {
  const { company_of_interest, modelConfig, trade_date } = props;

  try {
    // 1. 获取新闻数据
    // NewsAPI.org 免费版仅支持查询过去一个月的新闻
    // 因此，我们将起始日期设置为 trade_date 的前28天
    const toDate = new Date(trade_date);
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - 28);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const newsArticles = await getNewsFromApi(
      company_of_interest,
      formatDate(fromDate),
      formatDate(toDate)
    );

    if (newsArticles.length === 0) {
      return { news_report: "未找到相关新闻。" };
    }

    // 2. 格式化新闻并构建提示
    const formattedNews = formatNewsArticles(newsArticles);
    const prompt = fillPromptTemplate(newsTemplate, {
      news_articles: formattedNews,
    });

    // 3. 调用模型生成报告
    const result = await generateContent({
      modelConfig,
      prompt,
    });

    return { news_report: result };
  } catch (error) {
    console.error("Error generating news report:", error);
    return { news_report: "生成新闻分析报告时出错。" };
  }
}

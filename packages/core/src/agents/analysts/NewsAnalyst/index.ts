/**
 * @file 新闻分析师 Agent
 * @description 定义了用于分析和总结新闻的函数。
 */

import { getNewsData } from "../../../dataflows/googleNewsUtils";
import { fillPromptTemplate } from "../../utils";
import { NewsArticle } from "../../../types";
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
  trade_date: string;
}): Promise<{ news_report: string }> {
  const { company_of_interest, trade_date } = props;

  try {
    // 1. 获取新闻数据
    const newsArticles = await getNewsData(
      company_of_interest,
      "2024-01-01",
      trade_date
    ); // 注意：起始日期是硬编码的

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
      modelName: "gemini-2.5-flash",
      prompt
    });

    return { news_report: result };
  } catch (error) {
    console.error("Error generating news report:", error);
    return { news_report: "生成新闻分析报告时出错。" };
  }
}

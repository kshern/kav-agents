/**
 * @file NewsAPI.org 工具
 * @description 提供了用于从 NewsAPI.org 获取新闻数据的函数。
 */

import { NewsArticle } from "../types";

// 在此处填入您从 NewsAPI.org 获取的免费 API 密钥
// 获取地址: https://newsapi.org/register
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * 从 NewsAPI.org 获取新闻文章。
 *
 * @param query - 搜索查询词。
 * @param fromDate - 开始日期 (YYYY-MM-DD)。
 * @param toDate - 结束日期 (YYYY-MM-DD)。
 * @returns - 返回一个包含新闻文章的数组。
 */
export async function getNewsFromApi(
  query: string,
  fromDate: string,
  toDate: string,
): Promise<NewsArticle[]> {
  //   if (NEWS_API_KEY === 'YOUR_API_KEY_HERE') {
  //     throw new Error('请在 newsApiUtils.ts 文件中配置 NewsAPI.org 的 API 密钥。');
  //   }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query,
  )}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  console.log(url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`NewsAPI 请求失败: ${errorData.message}`);
    }

    const data = await response.json();

    if (data.status !== "ok") {
      throw new Error(`NewsAPI 返回错误: ${data.message}`);
    }

    // 将 NewsAPI.org 的文章格式转换为我们内部的 NewsArticle 格式
    return data.articles.map((article: any) => ({
      link: article.url,
      title: article.title,
      snippet: article.description || "",
      date: new Date(article.publishedAt).toLocaleDateString(),
      source: article.source.name,
    }));
  } catch (error) {
    console.error("获取 NewsAPI 数据时出错:", error);
    throw error;
  }
}

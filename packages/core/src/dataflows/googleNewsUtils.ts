/**
 * @file Google News 数据抓取工具
 * @description 该模块用于从 Google News 抓取指定查询和日期范围的新闻数据。
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { backOff } from 'exponential-backoff';

/**
 * @interface NewsArticle
 * @description 定义了单条新闻的数据结构。
 */
export interface NewsArticle {
  link: string;
  title: string;
  snippet: string;
  date: string;
  source: string;
}

/**
 * 发起网络请求，并在遇到速率限制 (429错误) 时进行指数退避重试。
 *
 * @param url - 请求的 URL。
 * @param headers - 请求头。
 * @returns - 返回请求的响应。
 */
async function makeRequest(url: string, headers: Record<string, string>) {
  const response = await axios.get(url, { headers });
  if (response.status === 429) {
    throw new Error('Rate limited');
  }
  return response;
}

/**
 * 抓取 Google News 的搜索结果。
 *
 * @param query - 搜索查询词。
 * @param startDate - 开始日期 (YYYY-MM-DD)。
 * @param endDate - 结束日期 (YYYY-MM-DD)。
 * @returns - 返回一个包含新闻文章的数组。
 */
export async function getNewsData(query: string, startDate: string, endDate: string): Promise<NewsArticle[]> {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
  };

  const newsResults: NewsArticle[] = [];
  let page = 0;

  while (true) {
    const offset = page * 10;
    const url = `https://www.google.com/search?q=${query}&tbs=cdr:1,cd_min:${formattedStartDate},cd_max:${formattedEndDate}&tbm=nws&start=${offset}`;

    try {
      const response = await backOff(() => makeRequest(url, headers), {
        numOfAttempts: 5,
      });

      const $ = cheerio.load(response.data);
      const resultsOnPage = $('div.SoaBEf');

      if (resultsOnPage.length === 0) {
        break; // 没有更多结果
      }

      resultsOnPage.each((_, el) => {
        const link = $(el).find('a').attr('href');
        const title = $(el).find('div.MBeuO').text();
        const snippet = $(el).find('.GI74Re').text();
        const date = $(el).find('.LfVVr').text();
        const source = $(el).find('.NUnG9d span').text();

        if (link && title && snippet && date && source) {
          newsResults.push({ link, title, snippet, date, source });
        }
      });

      if (!$('a#pnnext').length) {
        break; // 没有下一页
      }

      page++;
      // 添加随机延迟以避免被检测
      await new Promise(resolve => setTimeout(resolve, Math.random() * 4000 + 2000));
    } catch (e) {
      console.error(`多次重试后抓取失败: ${e}`);
      break;
    }
  }

  return newsResults;
}

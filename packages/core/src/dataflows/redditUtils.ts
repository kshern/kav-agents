/**
 * @file Reddit 数据处理工具
 * @description 该模块用于从本地文件系统读取和处理预存的 Reddit 数据。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { createReadStream } from 'fs';

/**
 * @interface RedditPost
 * @description 定义了单个 Reddit 帖子的数据结构。
 */
export interface RedditPost {
  title: string;
  content: string;
  url: string;
  upvotes: number;
  posted_date: string;
}

const tickerToCompany: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Google',
  AMZN: 'Amazon',
  TSLA: 'Tesla',
  NVDA: 'Nvidia',
  // ... (可以从原始 python 文件中复制完整的映射)
};

/**
 * 从指定类别的子版块中获取指定日期的热门帖子。
 *
 * @param category - 要获取的帖子类别 (子版块的集合)。
 * @param date - 获取帖子的日期 (YYYY-MM-DD)。
 * @param maxLimit - 要获取的最大帖子数量。
 * @param query - (可选) 在帖子中搜索的查询词。
 * @param dataPath - 数据文件夹的路径 (默认为 'reddit_data')。
 * @returns - 返回一个包含 Reddit 帖子的数组。
 */
export async function fetchTopFromCategory(
  category: string,
  date: string,
  maxLimit: number,
  query?: string,
  dataPath: string = 'reddit_data'
): Promise<RedditPost[]> {
  const basePath = path.join(dataPath, category);
  const allContent: RedditPost[] = [];

  try {
    const files = await fs.readdir(basePath);
    const limitPerSubreddit = Math.floor(maxLimit / files.length);

    for (const dataFile of files) {
      if (!dataFile.endsWith('.jsonl')) continue;

      const filePath = path.join(basePath, dataFile);
      const fileStream = createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      const subredditContent: RedditPost[] = [];

      for await (const line of rl) {
        if (!line.trim()) continue;

        const parsedLine = JSON.parse(line);
        const postDate = new Date(parsedLine.created_utc * 1000).toISOString().split('T')[0];

        if (postDate !== date) continue;

        if (query && category.includes('company')) {
          const companyName = tickerToCompany[query];
          const searchTerms = companyName ? [query, ...companyName.split(' OR ')] : [query];
          const found = searchTerms.some(term => 
            new RegExp(term, 'i').test(parsedLine.title) || new RegExp(term, 'i').test(parsedLine.selftext)
          );
          if (!found) continue;
        }

        subredditContent.push({
          title: parsedLine.title,
          content: parsedLine.selftext,
          url: parsedLine.url,
          upvotes: parsedLine.ups,
          posted_date: postDate,
        });
      }

      subredditContent.sort((a, b) => b.upvotes - a.upvotes);
      allContent.push(...subredditContent.slice(0, limitPerSubreddit));
    }

    return allContent;
  } catch (error) {
    console.error(`Error processing reddit data for category ${category}:`, error);
    return [];
  }
}

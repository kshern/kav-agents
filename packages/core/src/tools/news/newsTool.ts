/**
 * @file packages/core/src/tools/news/newsTool.ts
 * @description 基于 dataflows 的 NewsAPI 获取能力，提供给 Agent/LLM 可调用的工具包装。
 */

import { getNewsFromApi } from "../../dataflows/newsApiUtils";
import type { NewsArticle } from "../../types";

/**
 * 工具入参
 */
export type NewsToolInput = {
  /** 搜索关键词 */
  query: string;
  /** 开始日期（YYYY-MM-DD） */
  fromDate: string;
  /** 结束日期（YYYY-MM-DD） */
  toDate: string;
};

/**
 * 运行新闻工具，返回标准化后的新闻列表。
 * 依赖环境变量：NEWS_API_KEY。
 */
export async function runNewsTool(input: NewsToolInput): Promise<NewsArticle[]> {
  const { query, fromDate, toDate } = input;
  return getNewsFromApi(query, fromDate, toDate);
}

/**
 * 可选的工具描述对象，便于未来集中注册/管理。
 */
export const newsTool = {
  name: "get_news",
  description:
    "通过 NewsAPI.org 按关键词与日期范围获取新闻，返回标准化的 NewsArticle[]。需要设置环境变量 NEWS_API_KEY。",
  execute: runNewsTool,
};

export default newsTool;

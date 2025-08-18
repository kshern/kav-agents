/**
 * @file packages/core/src/tools/news/eventRegistryNewsTool.ts
 * @description EventRegistry 新闻工具包装，基于 dataflows 适配器。
 */

import type { NewsArticle } from "../../types";
import { getNewsFromEventRegistry } from "../../dataflows/eventRegistryNewsUtils";

export type EventRegistryNewsToolInput = {
  /** 搜索关键词 */
  query: string;
  /** 开始日期（YYYY-MM-DD） */
  fromDate: string;
  /** 结束日期（YYYY-MM-DD） */
  toDate: string;
};

export async function runEventRegistryNewsTool(
  input: EventRegistryNewsToolInput,
): Promise<NewsArticle[]> {
  const { query, fromDate, toDate } = input;
  return getNewsFromEventRegistry(query, fromDate, toDate);
}

export const eventRegistryNewsTool = {
  name: "eventregistry_get_news",
  description:
    "通过 EventRegistry 按关键词与日期范围获取媒体新闻，返回标准化 NewsArticle[]。需要环境变量 EVENTREGISTRY_API_KEY。",
  execute: runEventRegistryNewsTool,
};

export default eventRegistryNewsTool;

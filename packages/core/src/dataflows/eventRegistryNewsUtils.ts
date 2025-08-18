/**
 * @file EventRegistry 新闻获取适配器
 * @description 通过 EventRegistry API 获取新闻，映射为内部统一的 NewsArticle 结构。
 * 官方站点：https://eventregistry.org/
 * 文档入口（概述/示例）：https://www.newsapi.ai/documentation/examples
 * 说明：EventRegistry 提供 REST API（v1），常见端点为 POST https://eventregistry.org/api/v1/article/getArticles
 * 注意：实际字段名可能会有演进，请结合你的账号权限核对文档。
 */

import type { NewsArticle } from "../types";
import { ensureProxyInitialized } from "../utils/httpProxy";

const EVENTREGISTRY_API_KEY = process.env.EVENTREGISTRY_API_KEY;

ensureProxyInitialized();

// 参考 EventRegistry v1 REST 端点。请求体格式基于其公开示例整理。
const EVENTREGISTRY_API_ENDPOINT =
  "https://eventregistry.org/api/v1/article/getArticles";

/**
 * 从 EventRegistry 按关键词与日期范围获取新闻。
 * @param query - 关键词（建议包含公司名/股票代码/别名）
 * @param fromDate - 开始日期 YYYY-MM-DD
 * @param toDate - 结束日期 YYYY-MM-DD
 */
export async function getNewsFromEventRegistry(
  query: string,
  fromDate: string,
  toDate: string,
): Promise<NewsArticle[]> {
  if (!EVENTREGISTRY_API_KEY) {
    throw new Error(
      "请设置环境变量 EVENTREGISTRY_API_KEY（EventRegistry API Key）。",
    );
  }

  // EventRegistry 的查询对象支持复杂过滤。此处仅用最小可用示例：关键词 + 日期范围。
  // 若需限定中文/地区，可在 query.filters 中添加 lang/source/location 等过滤。
  const body = {
    apiKey: EVENTREGISTRY_API_KEY,
    // Query structure ref: https://www.newsapi.ai/documentation/examples
    query: {
      $query: {
        $and: [
          { keyword: query, keywordLoc: "title" }, // 标题包含关键词
          { dateStart: fromDate },
          { dateEnd: toDate },
        ],
      },
      // 可按需添加语言过滤（例如中文）："lang": ["chi", "zho"]
    },
    resultType: "articles",
    articlesSortBy: "date", // 按发布时间排序
    articlesCount: 50, // 单次最多 100，视权限与配额
  } as any;

  const resp = await fetch(EVENTREGISTRY_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await safeReadText(resp);
    throw new Error(`EventRegistry 请求失败: HTTP ${resp.status} ${errText}`);
  }

  const data: any = await safeReadJson(resp);

  // 典型返回：{ articles: { results: Article[], totalResults: number, ... } }
  const results: any[] = data?.articles?.results ?? [];

  return results.map((item) => {
    const url: string = item?.url || item?.urlArticle || "";
    const title: string = item?.title || "";
    const snippet: string = item?.body || item?.summary || "";
    const dateRaw: string =
      item?.dateTimePub || item?.date || item?.dateTime || new Date().toISOString();
    const sourceName: string = item?.source?.title || item?.source?.uri || "EventRegistry";

    return {
      link: url,
      title,
      snippet,
      date: new Date(dateRaw).toLocaleDateString(),
      source: sourceName,
    } as NewsArticle;
  });
}

async function safeReadText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

async function safeReadJson(resp: Response): Promise<any> {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

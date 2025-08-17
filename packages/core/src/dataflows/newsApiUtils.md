# packages/core/src/dataflows/newsApiUtils.ts

## 概述

- 文件职责：封装 NewsAPI.org 数据获取能力，提供关键字与日期范围的新闻抓取，并转换为统一的 `NewsArticle` 结构。
- 上下文/模块：`dataflows` 金融数据源适配层；供上层新闻分析能力与 Agent 在流水线中调用。

## 位置与命名

- 相对路径：`packages/core/src/dataflows/newsApiUtils.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- function `getNewsFromApi(query: string, fromDate: string, toDate: string): Promise<NewsArticle[]>`
  - 描述：按关键词和日期范围从 NewsAPI.org 获取新闻并映射到内部 `NewsArticle` 类型。

## 主要依赖

- 外部依赖：全局 `fetch`（Node 18+ 或 polyfill）
- 环境变量：`NEWS_API_KEY`
- 本地依赖：`../types` 中的 `NewsArticle`；`../utils/httpProxy` 中的 `ensureProxyInitialized()`

## 输入 / 输出

- 输入：
  - `query: string` 搜索关键词
  - `fromDate: string` 开始日期（YYYY-MM-DD）
  - `toDate: string` 结束日期（YYYY-MM-DD）
- 输出：
  - `Promise<NewsArticle[]>` 文章数组，字段：`title`、`link`、`source`、`snippet`、`date`
  - 错误：
    - 未配置 `NEWS_API_KEY`
    - HTTP 非 2xx 或响应状态 `status !== 'ok'`

## 使用示例

```ts
import { getNewsFromApi } from "../dataflows/newsApiUtils";

// 需在运行环境中设置 NEWS_API_KEY
// export NEWS_API_KEY=your_key

async function main() {
  const from = "2024-01-01";
  const to = "2024-01-07";
  const items = await getNewsFromApi("Apple", from, to);
  console.log(items.slice(0, 2));
}

main().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

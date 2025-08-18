# packages/core/src/tools/news/eventRegistryNewsTool.ts

## 概述

- 作用：为 LLM/Agent 提供基于 EventRegistry 的媒体新闻抓取工具包装。
- 依赖：`EVENTREGISTRY_API_KEY` 环境变量；底层适配器 `dataflows/eventRegistryNewsUtils.ts`。

## 导出

- `runEventRegistryNewsTool(input: EventRegistryNewsToolInput): Promise<NewsArticle[]>`
- `eventRegistryNewsTool`: `{ name, description, execute }`

## 输入/输出

- 输入 `EventRegistryNewsToolInput`
  - `query: string` 关键词（公司名/代码/别名）
  - `fromDate: string` 起始日期（YYYY-MM-DD）
  - `toDate: string` 截止日期（YYYY-MM-DD）
- 输出：`Promise<NewsArticle[]>`，字段：`title/link/source/snippet/date`

## 使用示例

```ts
import { runEventRegistryNewsTool } from "../tools/news/eventRegistryNewsTool";

const items = await runEventRegistryNewsTool({
  query: "腾讯控股 OR 0700.HK",
  fromDate: "2025-01-01",
  toDate: "2025-01-07",
});
console.log(items.slice(0, 3));
```

## 注意事项

- 可在适配器中进一步添加语言/地区过滤（例如中文 `chi/zho`）。
- EventRegistry 的字段与配额取决于套餐与版本，必要时根据账号文档微调查询结构。

## 变更记录

- 最后更新：2025-08-17

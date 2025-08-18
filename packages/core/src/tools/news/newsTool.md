# packages/core/src/tools/news/newsTool.ts

## 概述

- 文件职责：基于 `dataflows/newsApiUtils.ts` 的 `getNewsFromApi`，提供给 Agent/LLM 可直接调用的“新闻工具”包装。
- 模块分层：
  - `dataflows/` 负责数据源适配与统一结构映射；
  - `tools/` 负责将底层能力包装为可供模型/Agent 调用的工具接口。

## 位置与命名

- 相对路径：`packages/core/src/tools/news/newsTool.ts`
- 同名文档：本文件

## 导出清单

- function `runNewsTool(input: NewsToolInput): Promise<NewsArticle[]>`
  - 描述：执行新闻工具，返回标准化的 `NewsArticle[]`。
- const `newsTool`
  - 描述：工具描述对象，包含 `name`、`description` 与 `execute`，便于集中式工具注册与管理。

## 类型定义

- `NewsToolInput`
  - `query: string` 搜索关键词
  - `fromDate: string` 开始日期（YYYY-MM-DD）
  - `toDate: string` 结束日期（YYYY-MM-DD）
- 返回值：`Promise<NewsArticle[]>`

## 依赖

- 依赖底层实现：`../../dataflows/newsApiUtils` 的 `getNewsFromApi()`
- 环境变量：`NEWS_API_KEY`（由 dataflows 层消费）
- 运行环境需具备全局 `fetch`（Node 18+ 或 polyfill）

## 示例

```ts
import { runNewsTool } from "../tools/news/newsTool";

const items = await runNewsTool({
  query: "Apple",
  fromDate: "2025-01-01",
  toDate: "2025-01-07",
});
console.log(items.slice(0, 2));
```

## 变更记录

- 最后更新：2025-08-17

# packages/core/src/dataflows/redditUtils.ts

## 概述

- 文件职责：从本地 JSONL Reddit 数据集中按分类与日期筛选热门帖子，支持可选关键词（含股票代码到公司名的简单映射）。
- 上下文/模块：`dataflows` 本地数据适配层；供上层社媒分析能力与 Agent 流水线复用。

## 位置与命名

- 相对路径：`packages/core/src/dataflows/redditUtils.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- interface `RedditPost`
  - `{ title: string; content: string; url: string; upvotes: number; posted_date: string; }`
- function `fetchTopFromCategory(category: string, date: string, maxLimit: number, query?: string, dataPath?: string): Promise<RedditPost[]>`
  - 描述：遍历 `dataPath/category` 下各子文件的 `.jsonl`，按日期过滤、按 `upvotes` 排序并按子版块限额汇总后返回。

## 主要依赖

- 外部依赖：`fs/promises`、`path`、`readline`、`fs`（`createReadStream`）
- 本地依赖：无

## 输入 / 输出

- 输入：
  - `category: string` 类别目录名（例如 `company_discussions`）
  - `date: string` 目标日期（YYYY-MM-DD）
  - `maxLimit: number` 结果总上限（按子版块平均分配）
  - `query?: string` 可选搜索词；当 `category` 含 `company` 时会对股票代码做公司名扩展匹配
  - `dataPath: string = 'reddit_data'` 根数据目录
- 输出：
  - `Promise<RedditPost[]>` 筛选后的帖子列表；读取/解析异常时返回空数组 `[]`

## 使用示例

```ts
import { fetchTopFromCategory } from "../dataflows/redditUtils";

async function main() {
  const posts = await fetchTopFromCategory(
    "company_discussions",
    "2024-01-05",
    50,
    "AAPL",
    "/abs/path/to/reddit_data",
  );
  console.log(posts.slice(0, 5));
}

main().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

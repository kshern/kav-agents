# packages/core/src/abilities/analysts/NewsAnalyst/index.ts

## 概述

- 文件职责：新闻分析师能力，调用新闻数据源，渲染 `news.md` 模板并生成新闻分析报告。
- 上下文/模块：隶属 `abilities/analysts/` 子系统，被 Web API 与编排层调用。

## 位置与命名

- 相对路径：`packages/core/src/abilities/analysts/NewsAnalyst/index.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function analyzeNews

- 形态: function (async)
- 名称: analyzeNews
- 签名: `(props: NewsAnalystProps) => Promise<{ news_report: string }>`
- 行为: 调用 `getNewsFromApi()` 拉取时间窗内新闻，格式化后渲染模板并经 `generateContent()` 生成 `news_report`；无新闻或异常时返回回退文案。

## 主要依赖

- 外部依赖(0)：无
- 本地依赖(6)：`../../../dataflows/newsApiUtils`（`getNewsFromApi`）、`../../../utils`（`parseAndRenderTemplate`）、`../../../types`（`NewsAnalystProps`, `NewsArticle`）、`../../../utils/templateLoader`（`loadTemplate`）、`../../../models/gateway`（`generateContent`）、`../../../pipeline/modelResolver`（`getModelConfig`）

## 输入 / 输出

- 输入：`NewsAnalystProps`
  - `company_of_interest: string`
  - `trade_date: string | number | Date`
  - `modelConfig?: Model`（可选，若未传则使用 `getModelConfig("newsAnalyst")`）
  - `memory_config?: MemoryConfig`（类型中存在，当前实现未使用）
- 输出：`Promise<{ news_report: string }>`
  - 正常：模型生成的新闻分析
  - 无新闻：`"未找到相关新闻。"`
  - 失败回退：`"生成新闻分析报告时出错。"`

## 使用示例

```ts
import { analyzeNews } from "./index";
import type { NewsAnalystProps } from "../../../types";

const props: NewsAnalystProps = {
  company_of_interest: "AAPL",
  trade_date: "2024-12-31",
};

const { news_report } = await analyzeNews(props);
console.log(news_report);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.470Z
- 人工更新：2025-08-17T00:46:18+08:00

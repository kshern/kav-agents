# packages/core/src/dataflows/yfinUtils.ts

## 概述

- 文件职责：对 `yahoo-finance2` 进行轻量封装，提供历史行情、摘要信息、公司信息与三大报表等查询工具类。
- 上下文/模块：`dataflows` 金融数据源适配层；供上层分析能力与 Agent 在流水线中调用。

## 位置与命名

- 相对路径：`packages/core/src/dataflows/yfinUtils.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- class `YFinanceUtils`
  - `getStockData(symbol: string, startDate: string, endDate: string)` → 历史价格数组（yahoo-finance2 `historical` 原样返回）
  - `getStockInfo(symbol: string): Promise<ExtendedQuote>` → 最新 Quote（扩展字段：`longName`、`industry`、`sector`、`country`、`website` 等）
  - `getCompanyInfo(symbol: string)` → 提取并返回公司名/行业/板块/国家/网站的精简对象
  - `getStockDividends(symbol: string)` → 目前占位，返回空数组（可按需扩展）
  - `getIncomeStmt(symbol: string): Promise<any>` → `quoteSummary` 模块 `incomeStatementHistory`
  - `getBalanceSheet(symbol: string): Promise<any>` → `quoteSummary` 模块 `balanceSheetHistory`
  - `getCashFlow(symbol: string): Promise<any>` → `quoteSummary` 模块 `cashflowStatementHistory`
  - `getAnalystRecommendations(symbol: string): Promise<any>` → `quoteSummary` 模块 `recommendationTrend`

## 主要依赖

- 外部依赖：`yahoo-finance2`
- 环境变量：无（默认直连 yahoo-finance2）
- 本地依赖：无

## 输入 / 输出

- 输入：
  - `symbol: string` 股票代码
  - `startDate: string` / `endDate: string`（仅 `getStockData` 使用，YYYY-MM-DD）
- 输出：
  - 各方法返回 `Promise<...>`，与 `yahoo-finance2` 对应模块的返回结构保持一致或做轻度整理
  - 错误：网络或第三方 API 调用异常将向上抛出

## 使用示例

```ts
import { YFinanceUtils } from "../dataflows/yfinUtils";

async function main() {
  const yfin = new YFinanceUtils();
  const history = await yfin.getStockData("AAPL", "2024-01-01", "2024-01-31");
  const info = await yfin.getStockInfo("AAPL");
  const company = await yfin.getCompanyInfo("AAPL");
  console.log(history.length, info.longName, company);
}

main().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

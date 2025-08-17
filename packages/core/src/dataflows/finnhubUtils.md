# packages/core/src/dataflows/finnhubUtils.ts

## 概述

- 文件职责：从本地磁盘读取并筛选预先格式化的 Finnhub 数据，支持按日期范围与可选周期过滤。
- 上下文/模块：`dataflows` 本地数据适配层；供上层分析能力与 Agent 流水线复用。

## 位置与命名

- 相对路径：`packages/core/src/dataflows/finnhubUtils.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- function `getDataInRange(ticker: string, startDate: string, endDate: string, dataType: string, dataDir: string, period?: 'annual' | 'quarterly'): Promise<Record<string, any>>`
  - 描述：根据 `ticker`、日期范围、数据类型与根目录读取文件并筛选非空条目；可选按 `period` 选择年度/季度数据文件。

## 主要依赖

- 外部依赖：`fs/promises`、`path`
- 本地依赖：无

## 输入 / 输出

- 输入：
  - `ticker: string` 股票代码
  - `startDate: string` 开始日期（YYYY-MM-DD）
  - `endDate: string` 结束日期（YYYY-MM-DD）
  - `dataType: string` 数据类型（如 `insider_trans`, `SEC_filings` 等）
  - `dataDir: string` 数据根目录
  - `period?: 'annual' | 'quarterly'` 可选周期
- 输出：
  - `Promise<Record<string, any>>` 过滤后的对象，保留日期键在范围内且值为非空数组的条目
  - 错误处理：文件读取/解析异常将记录日志并返回空对象 `{}`

## 使用示例

```ts
import { getDataInRange } from "../dataflows/finnhubUtils";

async function main() {
  const data = await getDataInRange(
    "AAPL",
    "2023-01-01",
    "2023-12-31",
    "SEC_filings",
    "/abs/path/to/data",
    "annual",
  );
  console.log(Object.keys(data));
}

main().catch(console.error);
```

## 变更记录

- 最后更新：2025-08-17

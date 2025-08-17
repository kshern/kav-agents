# packages/core/src/dataflows/alphaVantageUtils.ts

## 概述

- 文件职责：封装 Alpha Vantage 股票数据获取能力，提供按股票代码拉取每日时间序列的函数。
- 上下文/模块：`dataflows` 金融数据源适配层；供上层分析能力与 Agent 在流水线中调用。

## 位置与命名

- 相对路径：`packages/core/src/dataflows/alphaVantageUtils.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- function `getStockData(symbol: string): Promise<any>`
  - 描述：获取指定 `symbol` 的每日时间序列数据（`TIME_SERIES_DAILY`）。

## 主要依赖

- 外部依赖：全局 `fetch`（Node 18+ 或 polyfill）
- 环境变量：`ALPHA_VANTAGE_API_KEY`
- 本地依赖：`../utils/httpProxy` 中的 `ensureProxyInitialized()`（根据代理配置初始化全局代理）

## 输入 / 输出

- 输入：
  - `symbol: string` 股票代码（如 `IBM`）
- 输出：
  - `Promise<any>` 原始 Alpha Vantage 响应 JSON
  - 错误：
    - 未配置 `ALPHA_VANTAGE_API_KEY`
    - HTTP 非 2xx
    - 速率限制提示 `Note` 或字段级 `Error Message`

## 使用示例

```ts
import { getStockData } from "../dataflows/alphaVantageUtils";

// 需在运行环境中设置 ALPHA_VANTAGE_API_KEY
// export ALPHA_VANTAGE_API_KEY=your_key

async function main() {
  try {
    const data = await getStockData("IBM");
    console.log(Object.keys(data));
  } catch (err) {
    console.error("Alpha Vantage 调用失败:", err);
  }
}

main();
```

## 变更记录

- 最后更新：2025-08-17

# tushare-ts

TypeScript 封装的 TuShare Pro 客户端。特性：

- 强类型端点（严格模式，不使用 any）
- 鉴权（token）、超时、错误处理
- 指数退避重试、固定窗口速率限制
- 可选内存缓存（TTL）
- 便捷端点封装与入口导出
- 为未来 MCP Server 扩展预留（同一客户端可复用）

## 安装与环境

- monorepo 内使用，无需单独发布。
- 需要环境变量 `TUSHARE_TOKEN`。

## 快速开始

```ts
import { createClientFromEnv, getDaily, getStockBasic, getTradeCal } from 'tushare-ts';

// 基于环境变量创建客户端，默认读取 TUSHARE_TOKEN
const client = createClientFromEnv({
  // 可选：覆盖限速/重试/缓存
  rateLimit: { maxRequests: 50, perSeconds: 60 },
  retries: { retries: 2, minDelayMs: 500, maxDelayMs: 3000 },
  cache: { enabled: true, ttlMs: 10000 },
});

// 1) 拉取日线行情
const daily = await getDaily(client, { ts_code: '600519.SH', start_date: '20240101', end_date: '20240131' }, [
  'ts_code',
  'trade_date',
  'open',
  'close',
]);

// 2) 拉取基础信息
const basics = await getStockBasic(client, { exchange: 'SSE', list_status: 'L' }, [
  'ts_code',
  'name',
  'industry',
]);

// 3) 交易日历
const cal = await getTradeCal(client, { exchange: 'SSE', start_date: '20240101', end_date: '20240131' }, [
  'cal_date',
  'is_open',
]);
```

## API 概览

- `TushareClient`：核心客户端类（鉴权/请求/重试/限速/缓存）
- `createClientFromEnv`：从环境变量创建客户端（默认 `TUSHARE_TOKEN`）
- `client.call<T>({ apiName, params, fields })`：通用调用
- 便捷端点：`getDaily`、`getStockBasic`、`getTradeCal`

## 端点扩展建议

新增端点只需：

1. 在 `src/types.ts` 增加对应的参数与返回类型（不使用 any）
2. 在 `src/endpoints/xxx.ts` 写一个便捷函数：
   ```ts
   export async function getXxx(client: ITushareClient, params: XxxParams, fields?: readonly (keyof XxxRecord)[]) {
     return client.call<XxxRecord>({ apiName: 'xxx', params, fields });
   }
   ```
3. 在 `src/index.ts` 导出该函数与类型

## 速率限制与重试

- 采用固定时间窗口（默认 60s/50 次），超额请求会等待到下一窗口
- 业务/网络错误触发指数退避重试（默认最多 2 次）
- 可按需调整 `rateLimit` 与 `retries` 参数

## 缓存

- 简易内存缓存（默认开启 10 秒）
- 以 `apiName + params + fields` 作为 key
- 可通过 `client.call({ ..., useCache: false })` 跳过缓存

## MCP Server 规划（草案）

- 新增包 `packages/tushare-mcp/`，依赖 `tushare-ts`
- 暴露以下工具：
  - `tushare.getDaily`、`tushare.getStockBasic`、`tushare.getTradeCal` 等
- 会话级速率限制（复用 `TushareClient`）与鉴权
- 从宿主环境继承 `TUSHARE_TOKEN`，支持通过参数覆盖
- 响应结构直接返回强类型 JSON，便于上层代理消费

## 注意

- 本包不会主动发起构建校验；建议通过类型服务与单元测试验证
- 首次在 monorepo 使用需安装依赖（pnpm i）

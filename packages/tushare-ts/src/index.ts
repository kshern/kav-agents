// 统一导出客户端、类型与端点便捷函数（全部带中文注释）
export { TushareClient, createClientFromEnv } from './client';
export type {
  ITushareClient,
  TushareConfig,
  TushareParams,
  TushareRawResponse,
  DailyParams,
  DailyRecord,
  StockBasicParams,
  StockBasicRecord,
} from './types';

export { getDaily } from './endpoints/daily';
export { getStockBasic } from './endpoints/stock_basic';
export { getTradeCal } from './endpoints/trade_cal';
export { getDailyBasic } from './endpoints/daily_basic';
export { getAdjFactor } from './endpoints/adj_factor';
export { getFinaIndicator } from './endpoints/fina_indicator';

// 重新导出各端点的类型，便于集中导入
export type { DailyBasicParams, DailyBasicRecord } from './endpoints/daily_basic';
export type { AdjFactorParams, AdjFactorRecord } from './endpoints/adj_factor';
export type { FinaIndicatorParams, FinaIndicatorRecord } from './endpoints/fina_indicator';

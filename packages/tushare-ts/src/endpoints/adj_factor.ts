import type { ITushareClient, TushareParams } from '../types';

// 复权因子（adj_factor）常用字段
export interface AdjFactorRecord {
  ts_code?: string; // 证券代码
  trade_date?: string; // 交易日期 YYYYMMDD
  adj_factor?: number; // 复权因子
}

export interface AdjFactorParams extends TushareParams {
  ts_code?: string;
  trade_date?: string;
  start_date?: string;
  end_date?: string;
}

// 复权因子端点便捷封装
export async function getAdjFactor(
  client: ITushareClient,
  params: AdjFactorParams,
  fields?: readonly (keyof AdjFactorRecord)[],
): Promise<AdjFactorRecord[]> {
  return client.call<AdjFactorRecord>({ apiName: 'adj_factor', params, fields });
}

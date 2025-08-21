import type { ITushareClient, StockBasicParams, StockBasicRecord } from '../types';

// 基础信息（stock_basic）端点便捷封装
export async function getStockBasic(
  client: ITushareClient,
  params: StockBasicParams,
  fields?: readonly (keyof StockBasicRecord)[],
): Promise<StockBasicRecord[]> {
  return client.call<StockBasicRecord>({ apiName: 'stock_basic', params, fields });
}

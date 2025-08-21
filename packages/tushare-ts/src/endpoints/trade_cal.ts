import type { ITushareClient, TushareParams } from '../types';

// 交易日历（trade_cal）记录类型与参数类型
export interface TradeCalRecord {
  exchange?: 'SSE' | 'SZSE' | 'BSE' | string; // 交易所代码
  cal_date?: string; // 日历日期 YYYYMMDD
  is_open?: number; // 是否交易 0/1
  pretrade_date?: string | null; // 上一个交易日
}

export interface TradeCalParams extends TushareParams {
  exchange?: 'SSE' | 'SZSE' | 'BSE' | string;
  start_date?: string;
  end_date?: string;
  is_open?: number; // 0/1 过滤
}

// 交易日历端点便捷封装
export async function getTradeCal(
  client: ITushareClient,
  params: TradeCalParams,
  fields?: readonly (keyof TradeCalRecord)[],
): Promise<TradeCalRecord[]> {
  return client.call<TradeCalRecord>({ apiName: 'trade_cal', params, fields });
}

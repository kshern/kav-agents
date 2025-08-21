import type { ITushareClient, TushareParams } from '../types';

// 日线指标（daily_basic）常用字段类型定义（精简子集）
export interface DailyBasicRecord {
  ts_code?: string; // 证券代码
  trade_date?: string; // 交易日期 YYYYMMDD
  close?: number; // 收盘价
  turnover_rate?: number; // 换手率
  volume_ratio?: number; // 量比
  pe?: number; // 市盈率（总市值/净利润，TTM）
  pb?: number; // 市净率（总市值/净资产）
  ps?: number; // 市销率
  total_mv?: number; // 总市值（万元）
  circ_mv?: number; // 流通市值（万元）
}

export interface DailyBasicParams extends TushareParams {
  ts_code?: string;
  trade_date?: string;
  start_date?: string;
  end_date?: string;
}

// 日线指标端点便捷封装
export async function getDailyBasic(
  client: ITushareClient,
  params: DailyBasicParams,
  fields?: readonly (keyof DailyBasicRecord)[],
): Promise<DailyBasicRecord[]> {
  return client.call<DailyBasicRecord>({ apiName: 'daily_basic', params, fields });
}

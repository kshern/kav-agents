import type { ITushareClient, TushareParams } from '../types';

// 财务指标数据（fina_indicator）常用字段精简定义
export interface FinaIndicatorRecord {
  ts_code?: string; // 证券代码
  end_date?: string; // 报告期 YYYYMMDD
  ann_date?: string | null; // 公告日期
  eps?: number | null; // 每股收益（元）
  roe?: number | null; // 净资产收益率（%）
  roa?: number | null; // 总资产报酬率（%）
  gross_margin?: number | null; // 毛利率（%）
  netprofit_margin?: number | null; // 销售净利率（%）
  debt_to_assets?: number | null; // 资产负债率（%）
  current_ratio?: number | null; // 流动比率
  quick_ratio?: number | null; // 速动比率
}

export interface FinaIndicatorParams extends TushareParams {
  ts_code?: string;
  start_date?: string; // 开始报告期
  end_date?: string; // 结束报告期
  period?: string; // 单一报告期（YYYYMMDD）
}

// 财务指标端点便捷封装
export async function getFinaIndicator(
  client: ITushareClient,
  params: FinaIndicatorParams,
  fields?: readonly (keyof FinaIndicatorRecord)[],
): Promise<FinaIndicatorRecord[]> {
  return client.call<FinaIndicatorRecord>({ apiName: 'fina_indicator', params, fields });
}

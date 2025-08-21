import type { ITushareClient, DailyParams, DailyRecord } from '../types';

// 日线行情（daily）端点便捷封装
// - 你也可以直接调用 client.call({ apiName: 'daily', ... })，本函数仅做类型收敛
export async function getDaily(
  client: ITushareClient,
  params: DailyParams,
  fields?: readonly (keyof DailyRecord)[], // 指定字段可减少带宽
): Promise<DailyRecord[]> {
  return client.call<DailyRecord>({ apiName: 'daily', params, fields });
}

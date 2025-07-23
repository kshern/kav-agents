/**
 * @file Finnhub 数据处理工具
 * @description 该模块用于从本地文件系统读取和处理预存的 Finnhub 数据。
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 从本地磁盘获取在指定日期范围内的 Finnhub 数据。
 *
 * @param ticker - 股票代码。
 * @param startDate - 开始日期 (YYYY-MM-DD)。
 * @param endDate - 结束日期 (YYYY-MM-DD)。
 * @param dataType - 要获取的数据类型 (例如: insider_trans, SEC_filings)。
 * @param dataDir - 数据存储的根目录。
 * @param period - 时期 (可选, 'annual' 或 'quarterly')。
 * @returns - 返回一个包含筛选后数据的对象。
 */
export async function getDataInRange(ticker: string, startDate: string, endDate: string, dataType: string, dataDir: string, period?: 'annual' | 'quarterly'): Promise<Record<string, any>> {
  let dataPath: string;

  if (period) {
    dataPath = path.join(
      dataDir,
      'finnhub_data',
      dataType,
      `${ticker}_${period}_data_formatted.json`
    );
  } else {
    dataPath = path.join(
      dataDir,
      'finnhub_data',
      dataType,
      `${ticker}_data_formatted.json`
    );
  }

  try {
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    const filteredData: Record<string, any> = {};
    for (const key in data) {
      if (key >= startDate && key <= endDate && Array.isArray(data[key]) && data[key].length > 0) {
        filteredData[key] = data[key];
      }
    }
    return filteredData;
  } catch (error) {
    console.error(`Error reading or parsing data file: ${dataPath}`, error);
    return {};
  }
}

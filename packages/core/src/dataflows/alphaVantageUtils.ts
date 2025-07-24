/**
 * @file Alpha Vantage 工具
 * @description 提供了用于从 Alpha Vantage API 获取金融数据的函数。
 */

// 在此处填入您从 Alpha Vantage 获取的免费 API 密钥
// 获取地址: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = "PKKHAH8M6NXQ1BYQ";

/**
 * 获取公司的每日时间序列股票数据。
 * @param symbol - 公司股票代码 (例如：'IBM')。
 * @returns - 返回包含股票数据的 JSON 对象。
 */
export async function getStockData(symbol: string): Promise<any> {
//   // 检查是否已配置 API 密钥
//   if (ALPHA_VANTAGE_API_KEY === "YOUR_API_KEY_HERE") {
//     throw new Error("请在 alphaVantageUtils.ts 文件中配置 Alpha Vantage API 密钥。");
//   }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API 请求失败，状态码: ${response.status}`);
    }
    const data = await response.json();

    // Alpha Vantage 在 API 调用频繁时可能会返回一个提示信息而不是错误
    if (data['Note']) {
        throw new Error(`Alpha Vantage API 调用备注: ${data['Note']}`);
    }

    // 检查是否有错误信息
    if (data['Error Message']) {
        throw new Error(`Alpha Vantage API 错误: ${data['Error Message']}`);
    }

    return data;
  } catch (error) {
    console.error("获取 Alpha Vantage 数据时出错:", error);
    throw error; // 将错误继续向上抛出
  }
}

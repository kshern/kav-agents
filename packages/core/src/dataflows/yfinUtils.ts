/**
 * @file Yahoo Finance 数据工具
 * @description 该模块使用 yahoo-finance2 库获取股票数据、公司信息和财务报表。
 */

import yahooFinance from "yahoo-finance2";

// 定义扩展的Quote接口，包含所有我们需要的属性
interface ExtendedQuote {
  longName?: string;
  industry?: string;
  sector?: string;
  country?: string;
  website?: string;
  [key: string]: any; // 允许其他属性
}

/**
 * @class YFinanceUtils
 * @description 封装了所有与 Yahoo Finance API 交互的方法。
 */
export class YFinanceUtils {
  /**
   * 检索指定股票在日期范围内的历史价格数据。
   *
   * @param symbol - 股票代码。
   * @param startDate - 开始日期 (YYYY-MM-DD)。
   * @param endDate - 结束日期 (YYYY-MM-DD)。
   * @returns - 返回包含股票历史数据的数组。
   */
  async getStockData(symbol: string, startDate: string, endDate: string) {
    return await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
    });
  }

  /**
   * 获取并返回最新的股票摘要信息。
   *
   * @param symbol - 股票代码。
   * @returns - 返回包含股票摘要信息的对象。
   */
  async getStockInfo(symbol: string): Promise<ExtendedQuote> {
    return (await yahooFinance.quote(symbol)) as ExtendedQuote;
  }

  /**
   * 获取并返回公司信息。
   *
   * @param symbol - 股票代码。
   * @returns - 返回包含公司信息的对象。
   */
  async getCompanyInfo(symbol: string) {
    const quote = await this.getStockInfo(symbol);
    return {
      "Company Name": quote?.longName || "N/A",
      Industry: quote?.industry || "N/A",
      Sector: quote?.sector || "N/A",
      Country: quote?.country || "N/A",
      Website: quote?.website || "N/A",
    };
  }

  /**
   * 获取并返回最新的股息数据。
   *
   * @param symbol - 股票代码。
   * @returns - 返回包含股息数据的数组。
   */
  async getStockDividends(symbol: string) {
    // yahoo-finance2 没有直接的 dividends 方法，但可以通过 historical 实现
    // 这里需要根据实际需求调整，暂时返回空数组
    return [];
  }

  /**
   * 获取并返回公司最新的损益表。
   *
   * @param symbol - 股票代码。
   * @returns - 返回损益表数据。
   */
  async getIncomeStmt(symbol: string): Promise<any> {
    return await yahooFinance.quoteSummary(symbol, {
      modules: ["incomeStatementHistory"],
    });
  }

  /**
   * 获取并返回公司最新的资产负债表。
   *
   * @param symbol - 股票代码。
   * @returns - 返回资产负债表数据。
   */
  async getBalanceSheet(symbol: string): Promise<any> {
    return await yahooFinance.quoteSummary(symbol, {
      modules: ["balanceSheetHistory"],
    });
  }

  /**
   * 获取并返回公司最新的现金流量表。
   *
   * @param symbol - 股票代码。
   * @returns - 返回现金流量表数据。
   */
  async getCashFlow(symbol: string): Promise<any> {
    return await yahooFinance.quoteSummary(symbol, {
      modules: ["cashflowStatementHistory"],
    });
  }

  /**
   * 获取最新的分析师建议。
   *
   * @param symbol - 股票代码。
   * @returns - 返回分析师建议数据。
   */
  async getAnalystRecommendations(symbol: string): Promise<any> {
    return await yahooFinance.quoteSummary(symbol, {
      modules: ["recommendationTrend"],
    });
  }
}

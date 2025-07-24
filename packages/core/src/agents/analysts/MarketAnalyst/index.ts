/**
 * @file 市场分析师 Agent
 * @description 定义了用于分析公司市场信息的函数。
 */
import { generateContent } from "../../utils/geminiUtils";
import { fillPromptTemplate } from "../../utils";
import template from "./market.md?raw";
import yfin from "yahoo-finance2";

/**
 * 分析给定公司的市场信息并生成报告。
 *
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含分析报告的对象。
 */
export async function analyzeMarket(
  props: { company_of_interest: string; trade_date: string }
): Promise<{ market_report: string }> {
  const { company_of_interest, trade_date } = props;

  try {
    // 1. 获取原始数据
    const stockData = await yfin.historical(company_of_interest, { period1: '2024-01-01', period2: trade_date });
    const stockInfo = await yfin.quote(company_of_interest);
    const recommendations = await yfin.recommendationsBySymbol(company_of_interest);

    // 2. 构建提示
    const prompt = fillPromptTemplate(template, {
      company_of_interest,
      trade_date,
      stockInfo: JSON.stringify(stockInfo, null, 2),
      recommendations: JSON.stringify(recommendations, null, 2),
      stockData: JSON.stringify(stockData.slice(-10), null, 2),
    });

    // 3. 调用模型生成报告
    const result = await generateContent({
      modelName: "gemini-2.0-flash-lite",
      prompt,
    });

    return { market_report: result };
  } catch (error) {
    console.error('Error generating market report:', error);
    return { market_report: '生成市场分析报告时出错。' };
  }
}

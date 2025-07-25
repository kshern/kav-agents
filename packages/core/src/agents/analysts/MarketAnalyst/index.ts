/**
 * @file 市场分析师 Agent
 * @description 定义了用于分析公司市场信息的函数。
 */
import { generateContent } from "../../utils/geminiUtils";
import { fillPromptTemplate } from "../../utils";
import template from "./market.md?raw";
import { getStockData } from "../../../dataflows/alphaVantageUtils";
import { Model } from "../../../types";

/**
 * 分析给定公司的市场信息并生成报告。
 *
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含分析报告的对象。
 */
export async function analyzeMarket(props: {
  company_of_interest: string;
  modelConfig: Model;
  trade_date: string;
}): Promise<{ market_report: string }> {
  const { company_of_interest, modelConfig, trade_date } = props;

  try {
    // 1. 获取原始数据
    const stockData = await getStockData(company_of_interest);
    console.log(stockData);
    // 2. 构建提示
    // 注意：Alpha Vantage 的免费 API 不直接提供详细的 stockInfo 和 recommendations
    // 我们将使用可用的历史数据来生成报告。
    const prompt = fillPromptTemplate(template, {
      company_of_interest,
      trade_date,
      stockInfo: "N/A", // 标记为不可用
      recommendations: "N/A", // 标记为不可用
      stockData: JSON.stringify(stockData, null, 2),
    });

    // 3. 调用模型生成报告
    const result = await generateContent({
      modelConfig,
      prompt,
    });

    return { market_report: result };
  } catch (error) {
    console.error("Error generating market report:", error);
    return { market_report: "生成市场分析报告时出错。" };
  }
}

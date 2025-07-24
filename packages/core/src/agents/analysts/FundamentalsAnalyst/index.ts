/**
 * @file 基本面分析师 Agent
 * @description 定义了用于分析公司基本面信息的函数。
 */
import { generateContent } from "../../utils/geminiUtils";
import { fillPromptTemplate } from "../../utils";
import template from "./fundamentals.md?raw";
import { FundamentalsAnalystProps } from "../../../types";

/**
 * 分析给定公司的基本面信息并生成报告。
 *
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含分析报告的对象。
 */
export async function analyzeFundamentals(
  props: FundamentalsAnalystProps
): Promise<{ fundamentals_report: string }> {
  const { company_of_interest, model_name, trade_date } = props;

  const prompt = fillPromptTemplate(template, {
    trade_date,
    company_of_interest,
  });

  try {
    const result = await generateContent({
      modelName: model_name,
      prompt,
    });

    return { fundamentals_report: result };
  } catch (error) {
    console.error("Error generating fundamentals report:", error);
    return { fundamentals_report: "生成基本面分析报告时出错。" };
  }
}

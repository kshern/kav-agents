/**
 * @file 基本面分析师 Agent
 * @description 定义了用于分析公司基本面信息的函数。
 */
import { generateContent } from "../../../models/gateway";
import { parseAndRenderTemplate } from "../../../utils";
import { loadTemplate } from "../../../utils/templateLoader";
import { FundamentalsAnalystProps } from "../../../types";
import { getModelConfig } from "../../../config/models"; // 集中式模型配置

// 在 Vite 环境下，您可通过 '?raw' 直接引入模板；此处统一用 loadTemplate 动态加载，无需本地 modelConfig
/**
 * 分析给定公司的基本面信息并生成报告。
 *
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含分析报告的对象。
 */
export const analyzeFundamentals = async (
  props: FundamentalsAnalystProps,
): Promise<{ fundamentals_report: string }> => {
  // 使用公共工具加载模板
  const template = await loadTemplate("fundamentals.md", import.meta.url);

  const { company_of_interest, trade_date, modelConfig } = props; // 支持注入模型配置
  const renderedTemplate = parseAndRenderTemplate(template, {
    company_of_interest,
    trade_date,
  });

  try {
    // 使用工具函数解析模板并渲染最终的prompt
    const finalPrompt = parseAndRenderTemplate(
      renderedTemplate,
      {
        trade_date,
        company_of_interest,
      },
      true, // 启用调试输出
    );

    // 计算有效模型并生成报告（优先使用注入，其次回退到集中默认）
    const effectiveModel = modelConfig ?? getModelConfig("fundamentalsAnalyst");
    const result = await generateContent({
      modelConfig: effectiveModel,
      prompt: finalPrompt,
    });

    return { fundamentals_report: result };
  } catch (error) {
    console.error("Error generating fundamentals report:", error);
    return { fundamentals_report: "生成基本面分析报告时出错。" };
  }
};

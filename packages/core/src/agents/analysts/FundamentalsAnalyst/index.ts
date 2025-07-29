/**
 * @file 基本面分析师 Agent
 * @description 定义了用于分析公司基本面信息的函数。
 */
import { generateContent } from "../../../utils/geminiUtils";
import { parseAndRenderTemplate } from "../../../utils";
import { loadTemplate } from "../../../utils/templateLoader";
import { FundamentalsAnalystProps } from "../../../types";

// 在 Vite 环境下，您需要手动添加以下导入语句：
// import fundamentalsTemplate from './fundamentals.md?raw';
// 然后在 analyzeFundamentals 函数中传入 fundamentalsTemplate 参数

/**
 * 分析给定公司的基本面信息并生成报告。
 *
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含分析报告的对象。
 */
export async function analyzeFundamentals(
  props: FundamentalsAnalystProps,
  // viteTemplate?: string // 在 Vite 环境下传入通过 import xxx?raw 导入的模板
): Promise<{ fundamentals_report: string }> {
  // 使用公共工具加载模板
  const template = await loadTemplate(
    "fundamentals.md",
    import.meta.url,
    // viteTemplate
  );
  
  const { company_of_interest, modelConfig, trade_date } = props;
  const renderedTemplate = parseAndRenderTemplate(template, {
    company_of_interest,
    trade_date,
  });
  console.log("template", template);
  
  try {
    // 使用工具函数解析模板并渲染最终的prompt
    const finalPrompt = parseAndRenderTemplate(
      renderedTemplate, 
      { 
        trade_date, 
        company_of_interest 
      },
      true // 启用调试输出
    );

    // 不再需要返回元数据，因为它已经在parseAndRenderTemplate函数中处理
    const result = await generateContent({
      modelConfig,
      prompt: finalPrompt,
    });

    return { fundamentals_report: result };
  } catch (error) {
    console.error("Error generating fundamentals report:", error);
    return { fundamentals_report: "生成基本面分析报告时出错。" };
  }
}

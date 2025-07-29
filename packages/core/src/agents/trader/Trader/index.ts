/**
 * @file 交易员 Agent
 * @description 定义了根据最终投资计划制定具体交易提案的函数。
 */

import { AgentState } from "../../../models/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import traderTemplate from "./trader.md?raw";
import { generateContent } from "../../../utils/geminiUtils";

/**
 * 基于最终的投资计划和所有分析，生成一个明确的交易提案。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回一个包含最终交易计划的对象。
 */
export async function createTradePlan(
  state: AgentState
): Promise<{ trader_investment_plan: string }> {
  const prompt = parseAndRenderTemplate(traderTemplate, {
    company_of_interest: state.company_of_interest,
    investment_plan: state.investment_plan,
    pastMemories: "", // 内存功能暂时禁用
  });

  try {
    const result = await generateContent({
      modelName: "gemini-2.5-flash",
      prompt
    });
    return { trader_investment_plan: result };
  } catch (error) {
    console.error("Error generating trader plan:", error);
    return { trader_investment_plan: "生成交易员计划时出错。" };
  }
}

/**
 * @file 交易员 Agent
 * @description 定义了根据最终投资计划制定具体交易提案的函数。
 */

import { Model, MemoryConfig } from "../../../types"; // 引入模型与记忆配置类型
import { parseAndRenderTemplate } from "../../../utils";
 import { loadTemplate } from "../../../utils/templateLoader"; // 统一的模板加载器（与 FundamentalsAnalyst 保持一致）
import { generateContent } from "../../../models/gateway";
import { buildPastMemories } from "../../../adapters/memory"; // 统一的记忆适配层

/**
 * 基于最终的投资计划和所有分析，生成一个明确的交易提案。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回一个包含最终交易计划的对象。
 */
/**
 * @interface TradePlan
 * @description 定义了最终交易计划的结构。
 */
export interface TradePlan {
  trader_investment_plan: string; // 交易员生成的最终交易提案
}

/**
 * 基于最终的投资计划和所有分析，生成一个明确的交易提案。
 *
 * @param state - 当前的 Agent 状态。
 * @returns - 返回一个包含最终交易计划的对象。
 */
export async function createTradePlan(
  props: {
    // 基础输入（从全局状态按 inputs 动态注入）
    company_of_interest: string;
    investment_plan: string;
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    // 可选：配置驱动的记忆策略（由编排层透传）
    memory_config?: MemoryConfig;
    // 模型配置（由编排层统一传入）
    modelConfig: Model;
  },
): Promise<TradePlan> {
  // 读取记忆策略（默认：情境检索 topK=2，与 Python 行为对齐）
  const effectiveMemory: MemoryConfig = props.memory_config ?? {
    strategy: "situation",
    topK: 2,
  };

  // 构造“情境字符串”（四报告拼接）
  const situation = [
    props.market_report,
    props.sentiment_report,
    props.news_report,
    props.fundamentals_report,
  ]
    .filter(Boolean)
    .join("\n\n");

  // 根据策略构建过去记忆字符串
  // - situation：基于情境相似检索
  // - history：基于对话历史的 BufferMemory（此处 Trader 无对话历史，传空数组回退到情境或空）
  let pastMemories = "";
  try {
    if (effectiveMemory.strategy === "situation") {
      pastMemories = await buildPastMemories(
        [],
        "trader_past_memories",
        {
          strategy: "situation",
          situation,
          topK: effectiveMemory.topK ?? 2,
        },
      );
    } else {
      // history 策略：Trader 无会话历史，这里传空数组，BufferMemory 会返回空摘要
      pastMemories = await buildPastMemories([], "trader_past_memories", {
        strategy: "history",
      });
    }
  } catch (e) {
    // 记忆检索失败不影响主流程，降级为空
    console.warn("Trader.buildPastMemories failed:", e);
    pastMemories = "";
  }

  // 使用公共模板加载器按 URL 相对路径加载 Markdown 模板（与 FundamentalsAnalyst 保持一致）
  const template = await loadTemplate("trader.md", import.meta.url);
  const prompt = parseAndRenderTemplate(template, {
    company_of_interest: props.company_of_interest,
    investment_plan: props.investment_plan,
    pastMemories,
  });

  try {
    const result = await generateContent({
      modelConfig: props.modelConfig,
      prompt,
    });
    return { trader_investment_plan: result };
  } catch (error) {
    console.error("Error generating trader plan:", error);
    return { trader_investment_plan: "生成交易员计划时出错。" };
  }
}

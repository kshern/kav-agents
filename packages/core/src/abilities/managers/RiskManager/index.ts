/**
 * @file 风险经理 Agent
 * @description 整合风险辩论与记忆并产出最终交易决策（普通步骤签名）。
 */

import { RiskDebateState } from "../../../types/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import { loadTemplate } from "../../../utils/templateLoader";
import { generateContent } from "../../../models/gateway";
import { Model, MemoryConfig } from "../../../types";
import { buildPastMemories } from "../../../adapters/memory";

/**
 * 整合所有分析报告和交易员计划，评估风险辩论，并生成最终的交易决策。
 * - 记忆策略：默认使用情境检索（topK=2），可由 memory_config 覆盖。
 * - 情境字符串：由市场/情绪/新闻/基本面报告与计划拼接而成。
 */
export async function manageRisk(props: {
  // 状态切片（由编排器按 inputs 注入）
  risk_debate_state: RiskDebateState;
  trader_investment_plan?: string;
  investment_plan?: string;
  market_report: string;
  sentiment_report: string;
  news_report: string;
  fundamentals_report: string;
  // 运行时注入
  modelConfig: Model;
  memory_config?: MemoryConfig;
}): Promise<{
  risk_debate_state: RiskDebateState;
  final_trade_decision: string;
}> {
  const {
    risk_debate_state,
    trader_investment_plan,
    investment_plan,
    market_report,
    sentiment_report,
    news_report,
    fundamentals_report,
    modelConfig,
    memory_config,
  } = props;

  // 计划优先选择交易员产出，其次使用研究经理产出，避免模板缺口
  const plan = trader_investment_plan || investment_plan || "";

  // 构造情境字符串（与 Python 对齐：四报告 + 计划），用于情境记忆检索
  const situation = [
    `Market: ${market_report || ""}`,
    `Sentiment: ${sentiment_report || ""}`,
    `News: ${news_report || ""}`,
    `Fundamentals: ${fundamentals_report || ""}`,
    plan ? `Plan: ${plan}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  // 构建过去记忆字符串（适配层统一入口）
  const effectiveStrategy = memory_config?.strategy ?? "situation";
  const effectiveTopK = memory_config?.topK ?? 2;
  const pastMemories = await buildPastMemories([], "past_memories", {
    strategy: effectiveStrategy,
    situation,
    topK: effectiveTopK,
  });

  // 使用通用模板加载方式，保持与 FundamentalsAnalyst 一致
  const template = await loadTemplate("risk.md", import.meta.url);
  const prompt = parseAndRenderTemplate(template, {
    investment_plan: plan,
    past_memories: pastMemories,
    risk_debate_history: risk_debate_state.history,
  });

  try {
    const result = await generateContent({
      modelConfig,
      prompt,
    });

    const newRiskDebateState: RiskDebateState = {
      ...risk_debate_state,
      judge_decision: result,
      latest_speaker: "Judge",
    };

    return {
      risk_debate_state: newRiskDebateState,
      final_trade_decision: result,
    };
  } catch (error) {
    console.error("Error managing risk debate:", error);
    const decision = "在管理风险辩论并做出决策时出错。";
    return {
      risk_debate_state: {
        ...risk_debate_state,
        judge_decision: decision,
        latest_speaker: "Judge",
      },
      final_trade_decision: decision,
    };
  }
}

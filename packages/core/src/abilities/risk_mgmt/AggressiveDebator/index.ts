/**
 * @file 激进派辩手 Agent
 * @description 定义了在风险管理辩论中持激进观点的函数（已适配通用辩论能力签名）。
 */

import { RiskDebateState } from "../../../types/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import { loadTemplate } from "../../../utils/templateLoader";
import { generateContent } from "../../../models/gateway";
import { Model, MemoryConfig } from "../../../types";

/**
 * 基于交易员计划与所有报告，从激进视角生成论点并更新风险辩论状态。
 *
 * @param props.state - 仅包含本步骤所需的状态切片（由编排器按 inputs 动态构建）。
 * @param props.modelConfig - 模型配置（由编排器统一注入）。
 */
export async function debateAggressive(props: {
  state: {
    trader_investment_plan?: string;
    investment_plan?: string;
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    risk_debate_state: RiskDebateState;
    memory_config?: MemoryConfig; // 保留以对齐其它研究员签名（当前未直接使用）
  };
  modelConfig: Model;
}): Promise<{ risk_debate_state: RiskDebateState }> {
  const {
    state: {
      trader_investment_plan,
      investment_plan,
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      risk_debate_state,
    },
    modelConfig,
  } = props;

  // 交易员计划优先，兼容早期依赖 investment_plan 的模板
  const plan = trader_investment_plan || investment_plan || "";

  // 使用通用模板加载工具，保持与 FundamentalsAnalyst 一致
  const template = await loadTemplate("aggressive.md", import.meta.url);
  const prompt = parseAndRenderTemplate(template, {
    investment_plan: plan,
    risk_debate_history: risk_debate_state.history,
    market_report,
    sentiment_report,
    news_report,
    fundamentals_report,
  });

  try {
    const result = await generateContent({
      modelConfig,
      prompt,
    });

    const argument = `Aggressive Analyst: ${result}`;
    const newState: RiskDebateState = {
      ...risk_debate_state,
      // 将历史串接（RiskDebateState.history 为字符串）
      history: (risk_debate_state.history || "") + (risk_debate_state.history ? "\n" : "") + argument,
      risky_history: (risk_debate_state.risky_history || "") + (risk_debate_state.risky_history ? "\n" : "") + argument,
      current_risky_response: argument,
      latest_speaker: "Aggressive",
      count: (risk_debate_state.count || 0) + 1,
    };

    return { risk_debate_state: newState };
  } catch (error) {
    console.error("Error generating aggressive debator argument:", error);
    // 失败时返回原状态，避免中断流水线
    return { risk_debate_state };
  }
}

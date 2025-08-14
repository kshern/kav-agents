/**
 * @file 中立派辩手 Agent
 * @description 定义了在风险管理辩论中持中立观点的函数（已适配通用辩论能力签名）。
 */

import { RiskDebateState } from "../../../types/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import { generateContent } from "../../../models/gateway";
import { loadTemplate } from "../../../utils/templateLoader";
import { Model, MemoryConfig } from "../../../types";

/** 基于交易员计划与所有报告，从中立视角生成论点并更新风险辩论状态。 */
export async function debateNeutral(props: {
  state: {
    trader_investment_plan?: string;
    investment_plan?: string;
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    risk_debate_state: RiskDebateState;
    memory_config?: MemoryConfig;
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

  const plan = trader_investment_plan || investment_plan || "";

  const template = await loadTemplate("neutral.md", import.meta.url);
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
    const argument = `Neutral Analyst: ${result}`;
    const newState: RiskDebateState = {
      ...risk_debate_state,
      history: (risk_debate_state.history || "") + (risk_debate_state.history ? "\n" : "") + argument,
      neutral_history: (risk_debate_state.neutral_history || "") + (risk_debate_state.neutral_history ? "\n" : "") + argument,
      current_neutral_response: argument,
      latest_speaker: "Neutral",
      count: (risk_debate_state.count || 0) + 1,
    };
    return { risk_debate_state: newState };
  } catch (error) {
    console.error("Error generating neutral debator argument:", error);
    return { risk_debate_state };
  }
}

/**
 * @file 风险经理 Agent
 * @description 定义了用于管理风险评估流程、主持辩论并制定最终交易决策的函数。
 */

import { RiskDebateState } from "../../../types/agentStates";
import { parseAndRenderTemplate } from "../../../utils";
import riskTemplate from "./risk.md?raw";
import { generateContent } from "../../../models/gateway";
import { Model } from "../../../types";

const defaultModelConfig: Model = {
  provider: "openrouter",
  model_name: "z-ai/glm-4.5-air:free",
  api_key: process.env.OPENROUTER_API_KEY,
};

/**
 * 整合所有分析报告和交易员计划，评估风险辩论，并生成最终的交易决策。
 *
 * @param props - 包含当前风险辩论状态、投资计划和历史记忆的对象。
 * @returns - 返回一个包含更新后风险辩论状态和最终交易决策的对象。
 */
export async function manageRisk(props: {
  risk_debate_state: RiskDebateState;
  investment_plan: string;
  pastMemories: string;
  modelConfig?: Model;
}): Promise<{
  risk_debate_state: RiskDebateState;
  final_trade_decision: string;
}> {
  const { risk_debate_state, investment_plan, pastMemories, modelConfig } =
    props;

  const prompt = parseAndRenderTemplate(riskTemplate, {
    investment_plan: investment_plan,
    past_memories: pastMemories,
    risk_debate_history: risk_debate_state.history,
  });

  try {
    const result = await generateContent({
      modelConfig: modelConfig || defaultModelConfig,
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

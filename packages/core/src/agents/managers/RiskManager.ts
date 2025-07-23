/**
 * @file 风险经理 Agent
 * @description 定义了用于管理风险评估流程、主持辩论并制定最终交易决策的 RiskManager 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState, RiskDebateState } from '../../models/agentStates';
import { Memory } from '../utils/memory';

/**
 * @class RiskManager
 * @description 一个管理风险评估流程、评估辩论并制定最终交易决策的 Agent。
 */
export class RiskManager {
  private model: GenerativeModel;
  private memory: Memory;

  /**
   * 构造函数
   * @param model - 一个配置好的 Gemini GenerativeModel 实例。
   * @param memory - 一个 Memory 实例，用于存储和检索历史记忆。
   */
  constructor(model: GenerativeModel, memory: Memory) {
    this.model = model;
    this.memory = memory;
  }

  /**
   * 整合所有分析报告和交易员计划，评估风险辩论，并生成最终的交易决策。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回一个包含更新后风险辩论状态和最终交易决策的对象。
   */
  async manage(state: AgentState): Promise<{ risk_debate_state: RiskDebateState; final_trade_decision: string }> {
    const { 
      risk_debate_state,
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      investment_plan
    } = state;

    const currentSituation = `${market_report}\n\n${sentiment_report}\n\n${news_report}\n\n${fundamentals_report}`;
    const pastMemories = ""; // this.memory.getMemories(currentSituation, 2);

    const prompt = `
      作为风险管理裁判和辩论主持人，你的目标是评估三位风险分析师——激进派、中立派和保守派——之间的辩论，并为交易员确定最佳行动方案。
      你的决定必须产生一个明确的建议：买入、卖出或持有。只有在有特定论据充分支持的情况下才选择持有，而不是在各方观点看似都合理时作为后备选项。力求清晰和果断。

      决策指南：
      1. 总结关键论点：从每位分析师的观点中提取最有力的论点，重点关注其与当前背景的关联性。
      2. 提供理由：用辩论中的直接引语和反驳来支持你的建议。
      3. 完善交易员计划：从交易员的原始计划“${investment_plan}”开始，并根据分析师的见解进行调整。
      4. 从过去的错误中学习：利用从“${pastMemories}”中吸取的教训，解决先前的误判，并改进你现在正在做出的决定，以确保你不会做出导致亏损的错误买/卖/持有决策。

      交付成果：
      - 一个清晰且可操作的建议：买入、卖出或持有。
      - 基于辩论和过去反思的详细推理。

      ---

      分析师辩论历史：
      ${risk_debate_state.history}

      ---

      专注于可操作的见解和持续改进。借鉴过去的教训，批判性地评估所有观点，并确保每个决策都能推动更好的结果。
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const decision = response.text();

      const newRiskDebateState: RiskDebateState = {
        ...risk_debate_state,
        judge_decision: decision,
        latest_speaker: 'Judge',
      };

      return {
        risk_debate_state: newRiskDebateState,
        final_trade_decision: decision,
      };
    } catch (error) {
      console.error('Error managing risk debate:', error);
      const decision = '在管理风险辩论并做出决策时出错。';
      return {
        risk_debate_state: { ...risk_debate_state, judge_decision: decision, latest_speaker: 'Judge' },
        final_trade_decision: decision,
      };
    }
  }
}

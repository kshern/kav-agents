/**
 * @file 研究经理 Agent
 * @description 定义了用于管理研究流程、主持辩论并制定投资计划的 ResearchManager 类。
 */

import { GenerativeModel } from '@google/generative-ai';
import { AgentState, InvestDebateState } from '../../models/agentStates';
import { Memory } from '../utils/memory';

/**
 * @class ResearchManager
 * @description 一个管理研究流程、评估辩论并制定投资计划的 Agent。
 */
export class ResearchManager {
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
   * 整合所有分析报告，评估投资辩论，并生成最终的投资计划。
   *
   * @param state - 当前的 Agent 状态。
   * @returns - 返回一个包含更新后辩论状态和投资计划的对象。
   */
  async manage(state: AgentState): Promise<{ investment_debate_state: InvestDebateState; investment_plan: string }> {
    const { 
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      investment_debate_state 
    } = state;

    const currentSituation = `${market_report}\n\n${sentiment_report}\n\n${news_report}\n\n${fundamentals_report}`;
    
    // 模拟从内存中获取过去的决策反思
    // 在实际应用中，memory.get_memories 需要被实现
    const pastMemories = ""; // this.memory.getMemories(currentSituation, 2);

    const prompt = `
      作为投资组合经理和辩论主持人，你的职责是批判性地评估这一轮的辩论，并做出明确的决定：
      要么同意熊方分析师的观点，要么同意牛方分析师的观点，或者只有在有充分理由的情况下才选择持有。

      简明扼要地总结双方的关键论点，重点关注最令人信服的证据或推理。
      你的建议——买入、卖出或持有——必须清晰且可操作。不要仅仅因为双方都有道理就默认选择持有；
      要根据辩论中最有力的论据坚定立场。

      此外，为交易员制定一份详细的投资计划。这应包括：
      - 你的建议：一个由最令人信服的论据支持的果断立场。
      - 理由：解释为什么这些论据导致了你的结论。
      - 战略行动：实施建议的具体步骤。

      考虑到你在类似情况下的过往经验教训。利用这些见解来完善你的决策过程，确保你不断学习和进步。
      请以对话的方式呈现你的分析，就像自然交谈一样，无需特殊格式。

      以下是你过去的反思：
      "${pastMemories}"

      以下是本次辩论的内容：
      辩论历史：
      ${investment_debate_state.history}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const decision = response.text();

      const newInvestDebateState: InvestDebateState = {
        ...investment_debate_state,
        judge_decision: decision,
        current_response: decision,
      };

      return {
        investment_debate_state: newInvestDebateState,
        investment_plan: decision,
      };
    } catch (error) {
      console.error('Error managing research debate:', error);
      const decision = '在管理研究辩论并做出决策时出错。';
      return {
        investment_debate_state: { ...investment_debate_state, judge_decision: decision, current_response: decision },
        investment_plan: decision,
      };
    }
  }
}
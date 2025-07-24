/**
 * @file 管理者 Agent 的 Prompt
 * @description 此文件包含管理者代理的提示。
 */

import { InvestDebateState, RiskDebateState } from "../models/agentStates";

/**
 * @description 研究经理的 props
 * @param {string} pastMemories - 过去的记忆
 * @param {InvestDebateState} investment_debate_state - 投资辩论状态
 */
interface ResearchManagerProps {
  pastMemories: string; // 过去的记忆
  investment_debate_state: InvestDebateState; // 投资辩论状态
}


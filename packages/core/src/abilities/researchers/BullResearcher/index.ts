/**
 * @file 牛方研究员 Agent
 * @description 定义了在投资辩论中持看涨观点的函数。
 */

import { generateContent } from "../../../models/gateway";
import { parseAndRenderTemplate } from "../../../utils"; // 统一的模板渲染工具（支持 Mustache 风格占位符）
import { loadTemplate } from "../../../utils/templateLoader"; // 动态加载模板，兼容 Vite/Node 环境
import { InvestDebateState } from "../../../types/agentStates";
import { Model } from "../../../types";
import { buildPastMemories } from "../../../adapters/memory";

/**
 * @description 牛方研究员 Agent，负责提出看涨论点并更新辩论状态。
 *              此函数逻辑对齐自 Python 版本的 bull_researcher.py。
 * @param props 包含当前状态、模型配置和记忆模块的对象。
 * @returns 返回更新后的投资辩论状态。
 */
export async function researchBull(props: {
  state: {
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    investment_debate_state: InvestDebateState;
  };
  modelConfig: Model;
}): Promise<{ investment_debate_state: InvestDebateState }> {
  const {
    state: {
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
      investment_debate_state,
    },
    modelConfig,
  } = props;

  const history = investment_debate_state.history || [];
  const current_response = investment_debate_state.current_response || "";

  // 业务侧定义 memoryKey，需与模板占位符一致
  const memoryKey = "bull_past_memories";
  // 基于辩论历史构造过去记忆字符串（直接通过适配层）
  const past_memory_str = await buildPastMemories(history || [], memoryKey);

  // 将历史记录格式化为字符串
  const history_str = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // 动态加载并渲染模板（以 bull.md 为模板来源）
  const template = await loadTemplate("bull.md", import.meta.url);
  const prompt = parseAndRenderTemplate(template, {
    // 研究报告
    market_report,
    sentiment_report,
    news_report,
    fundamentals_report,
    // 辩论上下文
    argument_history: history_str,
    last_opponent_argument: current_response,
    // 过去记忆（经验教训）
    past_memories: past_memory_str,
  });

  try {
    // 调用 LLM 生成论点
    const response = await generateContent({
      modelConfig,
      prompt,
    });

    const argument = `Bull Analyst: ${response}`;

    // 更新投资辩论状态
    const new_investment_debate_state: InvestDebateState = {
      ...investment_debate_state,
      history: [...history, { role: "ai", content: argument }], // 修复角色类型
      // 修复历史记录类型，从数组操作改为字符串拼接
      bull_history:
        (investment_debate_state.bull_history || "") + `\n${argument}`,
      current_response: argument,
      count: (investment_debate_state.count || 0) + 1,
    };

    return { investment_debate_state: new_investment_debate_state };
  } catch (error) {
    console.error("Error in Bull Researcher:", error);
    // 在发生错误时，返回原始状态以避免破坏流程
    return { investment_debate_state };
  }
}

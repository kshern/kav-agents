/**
 * @file 牛方研究员 Agent
 * @description 定义了在投资辩论中持看涨观点的函数。
 */

import { generateContent } from "../../../models/gateway";
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

  // 动态构建牛方提示
  const prompt = `You are a Bull Analyst making the case for investing in the stock. Your goal is to present a well-reasoned argument emphasizing opportunities, strengths, and positive indicators. Leverage the provided research and data to highlight potential upsides and counter bearish arguments effectively.

Key points to focus on:

- Opportunities and Strengths: Highlight factors like market leadership, innovation, or strategic advantages that could drive the stock's performance.
- Competitive Strengths: Emphasize advantages such as a strong market position, superior technology, or a loyal customer base.
- Positive Indicators: Use evidence from financial data, market trends, or recent positive news to support your position.
- Bear Counterpoints: Critically analyze the bear argument with specific data and sound reasoning, exposing weaknesses or overly pessimistic assumptions.
- Engagement: Present your argument in a conversational style, directly engaging with the bear analyst's points and debating effectively rather than simply listing facts.

Resources available:

Market research report: ${market_report}
Social media sentiment report: ${sentiment_report}
Latest world affairs news: ${news_report}
Company fundamentals report: ${fundamentals_report}
Conversation history of the debate: ${history_str}
Last bear argument: ${current_response}
Reflections from similar situations and lessons learned: ${past_memory_str}
Use this information to deliver a compelling bull argument, refute the bear's claims, and engage in a dynamic debate that demonstrates the potential and strengths of investing in the stock. You must also address reflections and learn from lessons and mistakes you made in the past.
`;

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

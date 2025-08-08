/**
 * @file 熊方研究员 Agent
 * @description 定义了在投资辩论中持看跌观点的函数。
 */

import { generateContent } from "../../../models/gateway";
import { InvestDebateState } from "../../../types/agentStates";
import { Model } from "../../../types";
import { Memory } from "../../../memory"; // 假设存在一个记忆模块

/**
 * @description 熊方研究员 Agent，负责提出看跌论点并更新辩论状态。
 *              此函数逻辑对齐自 Python 版本的 bear_researcher.py。
 * @param props 包含当前状态、模型配置和记忆模块的对象。
 * @returns 返回更新后的投资辩论状态。
 */
export async function researchBear(props: {
  state: {
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    investment_debate_state: InvestDebateState;
  };
  modelConfig: Model;
  memory: Memory; // 引入记忆模块
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
    memory,
  } = props;

  const history = investment_debate_state.history || [];
  const current_response = investment_debate_state.current_response || "";

  // 组合报告以用于检索相似记忆
  const curr_situation = `${market_report}\n\n${sentiment_report}\n\n${news_report}\n\n${fundamentals_report}`;
  const past_memories = await memory.get_memories(curr_situation, 2);

  // 格式化过去的记忆
  const past_memory_str = past_memories
    .map((rec: { recommendation: string }) => rec.recommendation)
    .join("\n\n");

  // 将历史记录格式化为字符串
  const history_str = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // 动态构建提示
  const prompt = `You are a Bear Analyst making the case against investing in the stock. Your goal is to present a well-reasoned argument emphasizing risks, challenges, and negative indicators. Leverage the provided research and data to highlight potential downsides and counter bullish arguments effectively.

Key points to focus on:

- Risks and Challenges: Highlight factors like market saturation, financial instability, or macroeconomic threats that could hinder the stock's performance.
- Competitive Weaknesses: Emphasize vulnerabilities such as weaker market positioning, declining innovation, or threats from competitors.
- Negative Indicators: Use evidence from financial data, market trends, or recent adverse news to support your position.
- Bull Counterpoints: Critically analyze the bull argument with specific data and sound reasoning, exposing weaknesses or over-optimistic assumptions.
- Engagement: Present your argument in a conversational style, directly engaging with the bull analyst's points and debating effectively rather than simply listing facts.

Resources available:

Market research report: ${market_report}
Social media sentiment report: ${sentiment_report}
Latest world affairs news: ${news_report}
Company fundamentals report: ${fundamentals_report}
Conversation history of the debate: ${history_str}
Last bull argument: ${current_response}
Reflections from similar situations and lessons learned: ${past_memory_str}
Use this information to deliver a compelling bear argument, refute the bull's claims, and engage in a dynamic debate that demonstrates the risks and weaknesses of investing in the stock. You must also address reflections and learn from lessons and mistakes you made in the past.
`;

  try {
    // 调用 LLM 生成论点
    const response = await generateContent({
      modelConfig,
      prompt,
    });

    const argument = `Bear Analyst: ${response}`;

    // 更新投资辩论状态
    const new_investment_debate_state: InvestDebateState = {
      ...investment_debate_state,
      history: [...history, { role: "ai", content: argument }], // 修复角色类型
      // 修复历史记录类型，从数组操作改为字符串拼接
      bear_history:
        (investment_debate_state.bear_history || "") + `\n${argument}`,
      current_response: argument,
      count: (investment_debate_state.count || 0) + 1,
    };

    return { investment_debate_state: new_investment_debate_state };
  } catch (error) {
    console.error("Error in Bear Researcher:", error);
    // 在发生错误时，返回原始状态以避免破坏流程
    return { investment_debate_state };
  }
}

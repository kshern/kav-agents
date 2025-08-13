/**
 * @file 熊方研究员 Agent
 * @description 定义了在投资辩论中持看跌观点的函数。
 */

import { generateContent } from "../../../models/gateway";
import { parseAndRenderTemplate } from "../../../utils"; // 统一模板渲染工具
import { loadTemplate } from "../../../utils/templateLoader"; // 动态加载模板，兼容 Vite/Node 环境
import { InvestDebateState } from "../../../types/agentStates";
import { Model, MemoryConfig } from "../../../types";
import { buildPastMemories } from "../../../adapters/memory"; // 通过适配层收口，支持情境检索

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
    // 可选：记忆策略配置（由 TradeAgent 透传，用于配置驱动）
    memory_config?: MemoryConfig;
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

  // 读取配置驱动的记忆策略（优先使用透传配置，否则采用默认：situation/topK=2）
  const effectiveMemory: MemoryConfig =
    props.state.memory_config ?? { strategy: "situation", topK: 2 };

  let past_memory_str = "";
  if (effectiveMemory.strategy === "situation") {
    // 基于“当前情境（四报告拼接）+ topK”检索过去记忆（通过适配层收口），以对齐 Python 版本
    // 1）构造情境字符串（避免空值，引入最关键的四类报告）
    const situation = [
      market_report,
      sentiment_report,
      news_report,
      fundamentals_report,
    ]
      .filter((s) => !!s && s.length > 0)
      .join("\n");
    // 2）通过适配层构建过去记忆字符串（strategy: 'situation'）
    past_memory_str = await buildPastMemories(history || [], "bear_past_memories", {
      strategy: "situation",
      situation,
      topK: effectiveMemory.topK ?? 2,
    });
  } else {
    // 使用“历史摘要”策略（BufferMemory），保持兼容
    past_memory_str = await buildPastMemories(history || [], "bear_past_memories", {
      strategy: "history",
    });
  }

  // 将历史记录格式化为字符串
  const history_str = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // 动态加载并渲染模板（以 bear.md 为模板来源）
  const template = await loadTemplate("bear.md", import.meta.url);
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

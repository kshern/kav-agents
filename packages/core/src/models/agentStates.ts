/**
 * @file 定义了系统中所有 Agent（代理）的状态模型接口。
 */

/**
 * 辩论消息
 * @description 定义了辩论历史中单条消息的结构
 */
export interface DebateMessage {
  role: "human" | "ai";
  content: string;
}

/**
 * 投资辩论状态
 * @description 用于记录投资研究团队（牛方 vs 熊方）的辩论过程。
 */
export interface InvestDebateState {
  /** 牛方对话历史 */
  bull_history: string;
  /** 熊方对话历史 */
  bear_history: string;
  /** 完整对话历史 */
  history: DebateMessage[];
  /** 当前最新回应 */
  current_response: string;
  /** 裁判的最终决定 */
  judge_decision: string;
  /** 当前对话长度 */
  count: number;
}

/**
 * 风险管理辩论状态
 * @description 用于记录风险管理团队（激进派 vs 保守派 vs 中立派）的辩论过程。
 */
export interface RiskDebateState {
  /** 激进派分析师的对话历史 */
  risky_history: string;
  /** 保守派分析师的对话历史 */
  safe_history: string;
  /** 中立派分析师的对话历史 */
  neutral_history: string;
  /** 完整对话历史 */
  history: string;
  /** 最近发言的分析师 */
  latest_speaker: string;
  /** 激进派分析师的当前回应 */
  current_risky_response: string;
  /** 保守派分析师的当前回应 */
  current_safe_response: string;
  /** 中立派分析师的当前回应 */
  current_neutral_response: string;
  /** 裁判的决定 */
  judge_decision: string;
  /** 当前对话长度 */
  count: number;
}

/**
 * 主 Agent 状态
 * @description 定义了整个交易流程中传递的核心状态对象。
 */
export interface AgentState {
  /** 目标交易公司 */
  company_of_interest: string;
  /** 交易日期 */
  trade_date: string;
  /** 消息发送方 Agent */
  sender: string;

  // 研究阶段报告
  /** 市场分析报告 */
  market_report: string;
  /** 社交媒体情绪报告 */
  sentiment_report: string;
  /** 全球时事新闻报告 */
  news_report: string;
  /** 公司基本面报告 */
  fundamentals_report: string;

  // 研究团队讨论阶段
  /** 投资辩论状态 */
  investment_debate_state: InvestDebateState;
  /** 分析师生成的投资计划 */
  investment_plan: string;

  /** 交易员生成的投资计划 */
  trader_investment_plan: string;

  // 风险管理团队讨论阶段
  /** 风险评估辩论状态 */
  risk_debate_state: RiskDebateState;
  /** 风险分析师做出的最终交易决定 */
  final_trade_decision: string;

  // LangGraph 的消息状态，这里用 any 简化，后续可定义具体类型
  messages: any[];
}

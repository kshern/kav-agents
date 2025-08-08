/**
 * @file packages/core/src/types/index.ts
 * @description 核心共享类型定义
 */

import type {
  AgentState,
  InvestDebateState,
  RiskDebateState,
} from "./agentStates";
export type {
  AgentState,
  InvestDebateState,
  RiskDebateState,
} from "./agentStates";
export * from "./analysis";

/**
 * 定义了可以对游戏状态值执行的比较操作符。
 */
export type ConditionOperator =
  | "eq" // 等于
  | "neq" // 不等于
  | "gt" // 大于
  | "gte" // 大于或等于
  | "lt" // 小于
  | "lte" // 小于或等于
  | "contains" // 字符串或数组包含
  | "!contains"; // 字符串或数组不包含

/**
 * @interface Condition
 * @description 描述一个必须被满足的先决条件
 */
export interface Condition {
  /**
   * @property {string} path - 要检查的游戏状态值的路径 (例如, '主角.等级')
   */
  path: string;
  /**
   * @property {ConditionOperator} op - 比较操作符
   */
  op: ConditionOperator;
  /**
   * @property {unknown} value - 用于比较的值
   */
  value: unknown;
}

/**
 * @interface BaseProperty
 * @description 所有属性配置的基础接口，包含通用字段
 */
export interface BaseProperty {
  /** 显示的标签 */
  label: string;
  /** 关联的全局数据键 */
  key?: string;
  /** 决定此属性是否显示或启用的条件列表 */
  conditions?: Condition[];
}

/**
 * @interface TextProperty
 * @description 文本类型的属性
 */
export interface TextProperty extends BaseProperty {
  /** 类型标识 */
  type: "text";
}

/**
 * @interface ProgressProperty
 * @description 进度条类型的属性
 */
export interface ProgressProperty extends BaseProperty {
  /** 类型标识 */
  type: "progress";
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 颜色 */
  color?: string;
}

/**
 * @interface MetroLineProperty
 * @description 地铁线路类型的属性
 */
export interface MetroLineProperty extends BaseProperty {
  /** 类型标识 */
  type: "metro-line";
}

/**
 * @interface BooleanProperty
 * @description 布尔类型的属性
 */
export interface BooleanProperty extends BaseProperty {
  /** 类型标识 */
  type: "boolean";
}

/**
 * @interface NumberProperty
 * @description 数字类型的属性
 */
export interface NumberProperty extends BaseProperty {
  /** 类型标识 */
  type: "number";
  /** 数字到文本的映射 */
  mapping?: Record<string, string>;
}

/**
 * @interface ActionProperty
 * @description 动作类型的属性
 */
export interface ActionProperty extends BaseProperty {
  /** 类型标识，固定为 'action' */
  type: "action";
  /** 所属部分 */
  part: string;
  /** 动作处理函数/标识 */
  handle: string;
  /** 动作描述 */
  desc: string;
  /** 是否需要痴汉 */
  needChikan?: boolean;
  /** 是否需要停留在车站 */
  stayStation?: boolean;
  /** 是否是高频动作 */
  hot?: boolean;
  /** 行为产生的影响 */
  effects: Record<
    string,
    {
      base_value_change: number;
    }
  >;
}

// 可辨识联合类型，涵盖所有可能的属性类型
export type Property =
  | TextProperty
  | ProgressProperty
  | MetroLineProperty
  | BooleanProperty
  | NumberProperty
  | ActionProperty;

/**
 * @interface Model
 * @description 模型的属性
 */
export interface Model {
  /** 模型供应商，如 'openai' | 'google' */
  provider: "openai" | "google" | "openrouter" | "anthropic" | string;
  /** 模型名称 */
  model_name: string;
  /** API 密钥 */
  api_key?: string;
  /** API 密钥 */
  base_url?: string;
}

/**
 * @interface AnalystCommonProps
 * @description 所有分析师输入的通用属性
 */
export interface AnalystCommonProps {
  trade_date: string; // 交易日期
  company_of_interest: string; // 公司名称
}

/**
 * @type AnalystAbility
 * @description 通用的分析师能力函数类型，输入为通用属性，输出为未知（由具体实现决定）
 */
export type AnalystAbility<
  TInput extends AnalystCommonProps = AnalystCommonProps,
  TOutput = unknown,
> = (props: TInput) => Promise<TOutput>;

/**
 * @type DebateResearcherAbility
 * @description 辩论型研究员（牛/熊）通用能力函数签名，避免在业务侧硬编码具体名称
 */
export type DebateResearcherAbility = (props: {
  state: {
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    investment_debate_state: InvestDebateState;
  };
  modelConfig: Model;
}) => Promise<{ investment_debate_state: InvestDebateState }>;

/**
 * @interface FundamentalsAnalystProps
 * @description 基本面分析师的属性
 */
export interface FundamentalsAnalystProps extends AnalystCommonProps {}

/**
 * @interface MarketAnalystProps
 * @description 市场分析师的属性
 */
export interface MarketAnalystProps extends AnalystCommonProps {}

// 定义新闻文章的结构
export interface NewsArticle {
  title: string; // 标题
  link: string; // 链接
  source: string; // 来源
  snippet: string; // 摘要
  date: string; // 日期
}

/**
 * @interface NewsAnalystProps
 * @description 新闻分析师的属性
 */
export interface NewsAnalystProps {
  // 复用通用的分析师输入属性
  trade_date: string; // 交易日期
  company_of_interest: string; // 公司名称
}

// 定义 ResearchManager Agent 的输入参数类型
export interface ResearchManagerProps {
  pastMemories: string; // 过去的记忆或反思
  investment_debate_state: InvestDebateState; // 投资辩论状态
}

// 定义 RiskManager Agent 的输入参数类型
export type RiskManagerProps = {
  investment_plan: string;
  risk_debate_state: RiskDebateState;
};

/**
 * @description Trader Agent 的 props
 */
export type TraderProps = {
  company_of_interest: string;
  investment_plan: string;
  pastMemories: string;
};

/**
 * @description 内存模块的临时定义
 */
export type Memory = Record<string, any>;

/**
 * @interface AgentInput
 * @description Agent 的输入参数
 */
export interface AgentInput {
  company_of_interest: string;
  modelConfig?: Partial<Model>;
}

/**
 * @interface AgentContext
 * @description 定义了 Agent 在整个生命周期中用于存储和传递状态的上下文对象。
 */
export interface AgentContext {
  state: AgentState;
  modelConfig: Model;
  memory: Memory;
}

/**
 * @file 核心 Agent 类，负责编排和执行整个交易分析流程。
 */

import {
  analyzeFundamentals,
  analyzeMarket,
  analyzeNews,
  analyzeSocialMedia,
  createTradePlan,
  manageResearch,
  manageRisk,
  researchBear,
  researchBull,
} from '../abilities';

import type { TradePlan } from '../abilities';
import type {
  AgentContext,
  AgentInput,
  AgentState,
  Memory,
  Model,
} from '../types';

/**
 * @class Agent
 * @description 一个自主代理，通过一系列步骤来研究、分析和决定股票交易计划。
 */
export class Agent {
  // 代理的上下文，包含状态、模型配置和内存
  private context: AgentContext;

  /**
   * 构造函数
   * @param {AgentInput} input - 代理的输入参数
   */
  constructor(input: AgentInput) {
    this.context = this.initializeContext(input);
  }

  /**
   * 初始化代理的上下文
   * @param {AgentInput} input - 代理的输入参数
   * @returns {AgentContext}
   */
  private initializeContext(input: AgentInput): AgentContext {
    // 初始化代理状态
    const initialState: AgentState = {
      company_of_interest: input.company_of_interest,
      trade_date: new Date().toISOString().slice(0, 10),
      sender: 'Agent',
      market_report: '',
      sentiment_report: '',
      news_report: '',
      fundamentals_report: '',
      investment_debate_state: {},
      investment_plan: '',
      trader_investment_plan: '',
      risk_debate_state: {
        risky_history: '',
        safe_history: '',
        neutral_history: '',
        history: '',
        latest_speaker: '',
        current_risky_response: '',
        current_safe_response: '',
        current_neutral_response: '',
        judge_decision: '',
        count: 0,
      },
      final_trade_decision: '',
      messages: [],
    };

    // 配置模型参数
    const modelConfig: Model = {
      provider: 'google',
      model_name: 'gemini-pro',
      ...input.modelConfig,
    };

    // 初始化内存模块
    const memory: Memory = {};

    return { state: initialState, modelConfig, memory };
  }

  /**
   * 运行代理以完成整个交易分析和决策流程
   * @returns {Promise<AgentContext>}
   */
  public async run(): Promise<AgentContext> {
    await this._research();
    await this._analyze();
    await this._debate();
    await this._createPlan();
    await this._manage();
    console.log('【Agent】所有步骤完成。');
    return this.context;
  }

  /**
   * 研究阶段：收集看涨和看跌的研究报告
   */
  private async _research(): Promise<void> {
    console.log("--- 研究阶段 ---");
    const [bull_history, bear_history] = await Promise.all([
      researchBull({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
      researchBear({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
    ]);

    this.context.state.investment_debate_state.bull_history = bull_history;
    this.context.state.investment_debate_state.bear_history = bear_history;
  }

  /**
   * 分析阶段：从不同维度分析收集到的信息
   */
  private async _analyze(): Promise<void> {
    console.log("--- 分析阶段 ---");
    const [fundamentals_report, market_report, news_report, sentiment_report] = await Promise.all([
      analyzeFundamentals({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
      analyzeMarket({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
      analyzeNews({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
      analyzeSocialMedia({ company_of_interest: this.context.state.company_of_interest, trade_date: this.context.state.trade_date }),
    ]);

    this.context.state = {
      ...this.context.state,
      fundamentals_report,
      market_report,
      news_report,
      sentiment_report,
    };
  }

  /**
   * 辩论阶段：管理研究并生成初步投资计划
   */
  private async _debate(): Promise<void> {
    console.log("--- 辩论阶段 ---");
    const result = await manageResearch({ pastMemories: "", investment_debate_state: this.context.state.investment_debate_state });
    this.context.state.investment_debate_state = result.investment_debate_state;
    this.context.state.investment_plan = result.investment_plan;
  }

  /**
   * 计划阶段：创建详细的交易计划
   */
  private async _createPlan(): Promise<void> {
    console.log("--- 计划阶段 ---");
    const plan = await createTradePlan({ company_of_interest: this.context.state.company_of_interest, investment_plan: this.context.state.investment_plan, pastMemories: "" });
    this.context.state.trader_investment_plan = plan.trader_investment_plan;
  }

  /**
   * 管理阶段：进行风险管理并做出最终决策
   */
  private async _manage(): Promise<void> {
    console.log("--- 管理阶段 ---");
    const result = await manageRisk({ investment_plan: this.context.state.trader_investment_plan, risk_debate_state: this.context.state.risk_debate_state, pastMemories: "" });
    this.context.state.risk_debate_state = result.risk_debate_state;
    this.context.state.final_trade_decision = result.final_trade_decision;
  }
}


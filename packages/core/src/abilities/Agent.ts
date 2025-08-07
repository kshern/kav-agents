import {
  analyzeFundamentals,
  analyzeMarket,
  analyzeNews,
  analyzeSocialMedia,
} from '../abilities/analysts';
import { manageResearch, manageRisk } from '../abilities/managers';
import { researchBear, researchBull } from '../abilities/researchers';
import {
  debateAggressive,
  debateConservative,
  debateNeutral,
} from '../abilities/risk_mgmt';
import { createTradePlan, TradePlan } from '../abilities/trader';

/**
 * @interface AgentInput
 * @description Agent运行所需的输入参数
 */
export interface AgentInput {
  /**
   * @property {string} symbol - 股票代码
   */
  symbol: string;
  // 可以根据需要添加其他参数，例如时间范围、投资偏好等
}

/**
 * @interface AgentContext
 * @description Agent运行时的上下文，用于存储中间数据
 */
interface AgentContext {
  bullData?: unknown;
  bearData?: unknown;
  analysis?: {
    fundamentals: unknown;
    market: unknown;
    news: unknown;
    social: unknown;
  };
  debate?: {
    aggressive: unknown;
    conservative: unknown;
    neutral: unknown;
  };
}

/**
 * @class Agent
 * @description 一个完整的、面向对象的交易Agent，负责编排和执行整个分析、决策流程。
 */
export class Agent {
  private symbol: string;
  private context: AgentContext; // 用于存储运行过程中的中间数据和状态

  /**
   * @constructor
   * @description 初始化Agent
   * @param {AgentInput} input - Agent的输入参数
   */
  constructor(input: AgentInput) {
    this.symbol = input.symbol;
    this.context = {}; // 初始化上下文
    console.log(`[Agent] 已为 ${this.symbol} 创建实例。`);
  }

  /**
   * @method run
   * @description 启动Agent，执行完整的分析和交易计划制定流程。
   * @returns {Promise<TradePlan>} - 返回最终的交易计划
   */
  public async run(): Promise<TradePlan> {
    try {
      // 步骤 1: 研究
      await this._research();

      // 步骤 2: 分析
      await this._analyze();

      // 步骤 3: 辩论
      await this._debate();

      // 步骤 4: 创建交易计划
      const tradePlan = await this._createPlan();

      // 步骤 5: 投后管理（可选）
      await this._manage(tradePlan);

      console.log(`[Agent] 已为 ${this.symbol} 生成交易计划。`);
      return tradePlan;
    } catch (error) {
      console.error('[Agent] 运行过程中发生错误:', error);
      throw new Error('Agent执行失败');
    }
  }

  /**
   * @private _research
   * @description 执行研究任务，收集多空双方观点的数据。
   */
  private async _research(): Promise<void> {
    console.log('[Agent] 步骤 1: 开始研究...');
    const [bullData, bearData] = await Promise.all([
      researchBull({ symbol: this.symbol }),
      researchBear({ symbol: this.symbol }),
    ]);
    this.context.bullData = bullData;
    this.context.bearData = bearData;
    console.log('[Agent] 研究完成。');
  }

  /**
   * @private _analyze
   * @description 对研究数据进行多维度分析。
   */
  private async _analyze(): Promise<void> {
    console.log('[Agent] 步骤 2: 开始多维度分析...');
    const [fundamentals, market, news, social] = await Promise.all([
      analyzeFundamentals(this.context.bullData),
      analyzeMarket(this.context.bearData),
      analyzeNews({ symbol: this.symbol }),
      analyzeSocialMedia({ symbol: this.symbol }),
    ]);
    this.context.analysis = { fundamentals, market, news, social };
    console.log('[Agent] 分析完成。');
  }

  /**
   * @private _debate
   * @description 进行风险辩论，综合不同风险偏好的观点。
   */
  private async _debate(): Promise<void> {
    console.log('[Agent] 步骤 3: 开始风险辩论...');
    const [aggressive, conservative, neutral] = await Promise.all([
      debateAggressive(this.context.analysis),
      debateConservative(this.context.analysis),
      debateNeutral(this.context.analysis),
    ]);
    this.context.debate = { aggressive, conservative, neutral };
    console.log('[Agent] 辩论完成。');
  }

  /**
   * @private _createPlan
   * @description 根据分析和辩论结果创建最终的交易计划。
   * @returns {Promise<TradePlan>}
   */
  private async _createPlan(): Promise<TradePlan> {
    console.log('[Agent] 步骤 4: 开始创建交易计划...');
    const plan = await createTradePlan({
      analysis: this.context.analysis,
      debate: this.context.debate,
    });
    console.log('[Agent] 交易计划创建完成。');
    return plan;
  }

  /**
   * @private _manage
   * @description 对生成的计划进行管理（例如风险监控、记录等）。
   * @param {TradePlan} plan - 生成的交易计划
   */
  private async _manage(plan: TradePlan): Promise<void> {
    console.log('[Agent] 步骤 5: 开始执行投后管理...');
    await Promise.all([manageRisk(plan), manageResearch(plan)]);
    console.log('[Agent] 投后管理完成。');
  }
}

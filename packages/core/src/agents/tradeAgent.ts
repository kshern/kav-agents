import { analyzeFundamentals } from '../abilities/analysts/FundamentalsAnalyst';
import { analyzeMarket } from '../abilities/analysts/MarketAnalyst';
import { BaseAgent } from './BaseAgent';
import { FundamentalsAnalystProps, MarketAnalystProps } from '../types';

/**
 * 定义 TradeAgent 的输入类型
 */
export interface TradeAgentInput {
  symbol: string; // 股票代码
}

/**
 * 定义单个分析步骤的输出结果
 */
export interface AnalysisResult {
  id: string; // 步骤ID
  text: string; // 步骤描述
  result: unknown; // 分析结果
}

/**
 * 定义 TradeAgent 的输出类型
 */
export type TradeAgentOutput = AnalysisResult[];

/**
 * 交易 Agent，负责编排不同的分析师能力，完成对指定股票的综合分析
 */
export class TradeAgent extends BaseAgent<TradeAgentInput, TradeAgentOutput> {
  protected readonly name = 'TradeAgent';

  // 定义分析步骤
  private readonly analysisSteps = [
    { id: 'analyze_fundamentals', text: '分析公司基本面', analyst: 'fundamentalsAnalyst' },
    { id: 'analyze_market', text: '分析市场环境', analyst: 'marketAnalyst' },
  ];

  /**
   * 构造函数，在实例化时注册所需的能力
   */
  constructor() {
    super();
    this.registerAbility('fundamentalsAnalyst', analyzeFundamentals);
    this.registerAbility('marketAnalyst', analyzeMarket);
  }

  /**
   * 执行分析流程
   * @param input 包含股票代码的输入对象
   * @returns 返回一个包含所有分析步骤结果的数组
   */
  public async run(input: TradeAgentInput): Promise<TradeAgentOutput> {
    this.log(`开始为股票 ${input.symbol} 进行分析...`);
    const output: TradeAgentOutput = [];

    for (const step of this.analysisSteps) {
      try {
        this.log(`执行步骤: ${step.text}`);
        const analyst = this.getAbility<
          | ((props: FundamentalsAnalystProps) => Promise<{ fundamentals_report: string }>)
          | ((props: MarketAnalystProps) => Promise<{ market_report: string }>)
        >(step.analyst);

        if (!analyst) {
          throw new Error(`能力 '${step.analyst}' 未注册.`);
        }

        // 准备分析师所需的参数
        const analystInput = {
          company_of_interest: input.symbol,
          trade_date: new Date().toISOString().split('T')[0], // 使用当前日期
        };

        // 调用分析师的 run 方法，并传递转换后的输入
        const result = await analyst(analystInput);

        // 将结果存入输出数组
        output.push({
          id: step.id,
          text: step.text,
          result,
        });
      } catch (err) {
        this.handleError(err); // 错误处理并抛出异常
      }
    }

    this.log(`股票 ${input.symbol} 的分析完成.`);
    return output;
  }
}

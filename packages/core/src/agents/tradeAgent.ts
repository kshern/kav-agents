import { EventEmitter } from "events";
import { BaseAgent } from "./BaseAgent";
import { analyzeFundamentals } from "../abilities/analysts/FundamentalsAnalyst";
import { analyzeMarket } from "../abilities/analysts/MarketAnalyst";
import { analyzeNews } from "../abilities";
import type { AnalystAbility, AnalystCommonProps } from "../types";
import { runStepsStateful, StatefulStep } from "../pipeline/executor";
import type {
  TradeAgentOutput,
  AnalysisStepConfig,
  ProgressEvent,
  PipelineItemConfig,
  DebateGroupConfig,
  DebateMemberConfig,
  MemoryConfig, // 引入记忆策略配置类型（配置驱动）
} from "../types";
import { researchBull } from "../abilities/researchers/BullResearcher";
import { researchBear } from "../abilities/researchers/BearResearcher";
// import { manageResearch } from "../abilities/managers/ResearchManager";
import type { AgentState, Model } from "../types";
import { FileLogger } from "../utils/logger";

/**
 * 定义 TradeAgent 的输入类型
 */
export interface TradeAgentInput {
  symbol: string; // 股票代码
  debate_rounds?: number; // 辩论轮次（可选，用于覆盖配置中的默认轮次）
  debate_rounds_by_group?: Record<string, number>; // 按分组覆盖辩论轮次，例如 { main_debate: 2, risk_debate: 1 }
  /**
   * 可选：运行时覆盖记忆策略（最高优先级），将应用于所有辩论成员
   */
  memory_override?: MemoryConfig;
}

/**
 * 交易 Agent，负责编排不同的分析师能力，完成对指定股票的综合分析
 */
export class TradeAgent extends BaseAgent<TradeAgentInput, TradeAgentOutput> {
  protected readonly name = "TradeAgent";
  private eventEmitter = new EventEmitter();
  // 文件日志，记录每一步输入输出，便于离线分析
  private logger = new FileLogger("logs/trade-agent.log");

  /**
   * 全局默认记忆策略（当未在运行时/成员/分组指定时生效）
   * 对齐 Python：默认采用情境检索 topK=2
   */
  private readonly defaultMemory: MemoryConfig = { strategy: "situation", topK: 2 };

  // 类型守卫：判断流水线条目是否为辩论分组（避免使用 any）
  private static isDebateGroupConfig(
    item: PipelineItemConfig
  ): item is DebateGroupConfig {
    return (item as { type?: string }).type === "debate";
  }
  // public static readonly ANALYSIS_STEPS: PipelineItemConfig[] = [
  //   // 普通步骤：基本面
  //   {
  //     id: "analyze_fundamentals",
  //     text: "分析公司基本面",
  //     analyst: "fundamentalsAnalyst",
  //     inputs: ["company_of_interest", "trade_date"], // 从全局状态读取
  //     outputs: ["fundamentals_report"],              // 写回全局状态
  //     // 普通步骤通常不需要记忆，预留 memory 仅做扩展使用
  //     // memory: { strategy: "situation", topK: 2 },
  //   },
  //   // 普通步骤：市场
  //   {
  //     id: "analyze_market",
  //     text: "分析市场环境",
  //     analyst: "marketAnalyst",
  //     inputs: ["company_of_interest", "trade_date"],
  //     outputs: ["market_report"],
  //   },
  //   // 普通步骤：新闻
  //   {
  //     id: "analyze_news",
  //     text: "分析新闻",
  //     analyst: "newsAnalyst",
  //     inputs: ["company_of_interest", "trade_date"],
  //     outputs: ["news_report"],
  //   },

  //   // 辩论分组：主辩论（牛/熊）
  //   {
  //     type: "debate",
  //     group: "main_debate",
  //     rounds: 2, // 分组默认轮次（可被运行时/按组覆盖）
  //     // 分组级记忆配置：默认情境检索，抓取 3 条相似记忆
  //     memory: { strategy: "situation", topK: 3 },
  //     members: [
  //       {
  //         id: "bull_researcher",
  //         text: "牛方研究员辩论",
  //         analyst: "bullResearcher",
  //         inputs: [
  //           "market_report",
  //           "sentiment_report",
  //           "news_report",
  //           "fundamentals_report",
  //           "investment_debate_state",
  //         ],
  //         outputs: ["investment_debate_state"],
  //         order: 1,
  //         // 成员级覆盖：牛方改为历史摘要（覆盖分组 memory）
  //         memory: { strategy: "history" },
  //       },
  //       {
  //         id: "bear_researcher",
  //         text: "熊方研究员辩论",
  //         analyst: "bearResearcher",
  //         inputs: [
  //           "market_report",
  //           "sentiment_report",
  //           "news_report",
  //           "fundamentals_report",
  //           "investment_debate_state",
  //         ],
  //         outputs: ["investment_debate_state"],
  //         order: 2,
  //         // 不设置成员 memory => 继承分组 memory：situation/topK=3
  //       },
  //     ],
  //   }
  // ];
  // 定义分析步骤（静态配置，作为唯一数据源）
  // 采用联合类型：普通步骤（AnalysisStepConfig）或辩论分组（type: 'debate'）
  public static readonly ANALYSIS_STEPS: PipelineItemConfig[] = [
    {
      id: "analyze_fundamentals",
      text: "分析公司基本面",
      analyst: "fundamentalsAnalyst",
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["fundamentals_report"],
    },
    {
      id: "analyze_market",
      text: "分析市场环境",
      analyst: "marketAnalyst",
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["market_report"],
    },
    {
      id: "analyze_news",
      text: "分析新闻",
      analyst: "newsAnalyst",
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["news_report"],
    },
    {
      type: "debate", // 辩论分组
      group: "main_debate", // 分组键
      rounds: 3, // 该分组默认轮次
      members: [
        {
          id: "bull_researcher",
          text: "牛方研究员辩论",
          analyst: "bullResearcher",
          inputs: [
            "market_report",
            "sentiment_report",
            "news_report",
            "fundamentals_report",
            "investment_debate_state",
          ],
          outputs: ["investment_debate_state"],
          order: 1,
        },
        {
          id: "bear_researcher",
          text: "熊方研究员辩论",
          analyst: "bearResearcher",
          inputs: [
            "market_report",
            "sentiment_report",
            "news_report",
            "fundamentals_report",
            "investment_debate_state",
          ],
          outputs: ["investment_debate_state"],
          order: 2,
        },
      ],
    },
    // {
    //   id: "manage_research",
    //   text: "研究经理裁决与投资计划",
    //   analyst: "researchManager",
    //   inputs: ["investment_debate_state"],
    //   outputs: ["investment_plan", "investment_debate_state"],
    // },
  ];

  // 实例使用静态配置
  private readonly analysisSteps = TradeAgent.ANALYSIS_STEPS;

  /**
   * 获取分析步骤配置（静态方法）
   * @returns 分析步骤配置数组
   */
  public static getAnalysisSteps(): PipelineItemConfig[] {
    return TradeAgent.ANALYSIS_STEPS;
  }

  /**
   * 构造函数，在实例化时注册所需的能力
   */
  constructor() {
    super();
    this.registerAbility("fundamentalsAnalyst", analyzeFundamentals);
    this.registerAbility("marketAnalyst", analyzeMarket);
    this.registerAbility("newsAnalyst", analyzeNews);
    // 注册辩论型研究员能力，使用键与配置中的 analyst 对齐，便于通用调用
    this.registerAbility("bullResearcher", researchBull);
    this.registerAbility("bearResearcher", researchBear);
  }

  /**
   * 订阅进度事件
   * @param listener 事件监听器
   */
  public onProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.on("progress", listener);
  }

  /**
   * 取消订阅进度事件
   * @param listener 事件监听器
   */
  public offProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.off("progress", listener);
  }

  /**
   * 发送进度事件
   * @param event 进度事件数据
   */
  private emitProgress(event: ProgressEvent): void {
    this.eventEmitter.emit("progress", event);
  }

  /**
   * 解析辩论分组的实际轮次（优先级：分组覆盖 > 全局覆盖 > 分组默认 > 3）
   */
  private resolveDebateRounds(
    group: DebateGroupConfig,
    byGroup?: Record<string, number>,
    globalOverride?: number
  ): number {
    const groupKey = group.group;
    const groupOverride = byGroup?.[groupKey];
    const groupDefault =
      typeof group.rounds === "number" &&
      Number.isInteger(group.rounds) &&
      group.rounds > 0
        ? group.rounds
        : 3;
    const hasGroupOverride =
      typeof groupOverride === "number" &&
      Number.isInteger(groupOverride) &&
      groupOverride > 0;
    const hasGlobalOverride =
      typeof globalOverride === "number" &&
      Number.isInteger(globalOverride) &&
      globalOverride > 0;
    return hasGroupOverride
      ? (groupOverride as number)
      : hasGlobalOverride
        ? (globalOverride as number)
        : groupDefault;
  }

  /**
   * 根据配置 inputs 动态构造能力所需的 state 片段
   */
  private buildDynamicState(
    inputKeys: string[],
    state: AgentState
  ): Record<string, unknown> {
    const dynamicState: Record<string, unknown> = {};
    for (const key of inputKeys) {
      const val = (state as unknown as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        dynamicState[key] = val;
      } else {
        // 默认值策略：以 *_state 作为对象推断，其余按字符串
        dynamicState[key] = key.endsWith("_state") ? {} : "";
      }
    }
    return dynamicState;
  }

  /**
   * 按 outputs 抽取结果片段，缺失则从旧 state 透传
   */
  private extractOutputs(
    outputKeys: string[],
    rawResult: Record<string, unknown>,
    state: AgentState
  ): Record<string, unknown> {
    return outputKeys.reduce<Record<string, unknown>>((acc, key) => {
      const v = rawResult[key];
      acc[key] =
        v !== undefined
          ? v
          : (state as unknown as Record<string, unknown>)[key];
      return acc;
    }, {});
  }

  /**
   * 生成辩论步骤的 run 函数（封装日志、入参装配、能力调用与输出提取）
   */
  private createDebateRunFn(
    groupKey: string,
    member: DebateMemberConfig,
    round: number,
    modelConfig: Model,
    groupMemory?: MemoryConfig, // 分组级记忆配置（可为空）
    runtimeMemoryOverride?: MemoryConfig // 运行时覆盖（最高优先级）
  ): (state: AgentState) => Promise<Partial<AgentState>> {
    return async (state: AgentState): Promise<Partial<AgentState>> => {
      const inputKeys = member.inputs ?? [];
      const stepId = `${groupKey}__${member.id}_r${round}`;
      const dynamicState = this.buildDynamicState(inputKeys, state);

      // 计算有效记忆配置（优先级：运行时 > 成员 > 分组 > 全局默认）
      const effectiveMemory: MemoryConfig =
        runtimeMemoryOverride ??
        member.memory ??
        groupMemory ??
        this.defaultMemory;

      // 输入日志
      await this.logger.info("TradeAgent", "辩论步骤输入", {
        stepId,
        text: `${member.text}（第${round}轮）`,
        analyst: member.analyst,
        inputs: inputKeys,
        state: dynamicState,
        model: {
          provider: modelConfig.provider,
          model_name: modelConfig.model_name,
        },
        memory_config: effectiveMemory, // 记录选用的记忆策略，便于排查
      });

      // 能力调用（宽泛签名）
      const abilityUnknown = this.getAbility(member.analyst) as unknown;
      if (typeof abilityUnknown !== "function") {
        throw new Error(`能力 '${member.analyst}' 未注册.`);
      }
      type GenericDebateAbility = (props: {
        state: Record<string, unknown>;
        modelConfig: Model;
      }) => Promise<unknown>;
      const ability = abilityUnknown as GenericDebateAbility;

      const rawResultUnknown = await ability({
        // 将有效记忆配置透传给研究员（不破坏既有 state 结构）
        state: { ...dynamicState, memory_config: effectiveMemory },
        modelConfig,
      });
      const rawResult = rawResultUnknown as Record<string, unknown>;

      // 原始输出日志
      await this.logger.info("TradeAgent", "辩论步骤原始输出", {
        stepId,
        analyst: member.analyst,
        rawResult,
      });

      // 输出提取与日志
      const outputKeys = member.outputs ?? [];
      const partial = this.extractOutputs(outputKeys, rawResult, state);
      await this.logger.info("TradeAgent", "辩论步骤提取输出", {
        stepId,
        outputs: outputKeys,
        partial,
      });

      return partial as Partial<AgentState>;
    };
  }

  /**
   * 基于静态配置 ANALYSIS_STEPS 自动生成可执行步骤，支持多轮辩论
   * @param debateRounds 辩论轮次
   * @param modelConfig 模型配置
   */
  private buildStepsFromConfig(
    debateRoundsByGroupOverride: Record<string, number> | undefined, // 按分组覆盖的轮次
    debateRoundsOverride: number | undefined, // 全局覆盖轮次
    modelConfig: Model,
    runtimeMemoryOverride?: MemoryConfig // 运行时记忆策略覆盖
  ): Array<StatefulStep<AgentState>> {
    const steps: Array<StatefulStep<AgentState>> = [];

    for (const item of this.analysisSteps) {
      // 分支1：辩论分组
      if (TradeAgent.isDebateGroupConfig(item)) {
        const groupItem = item;
        const groupKey = groupItem.group;
        const debateRounds = this.resolveDebateRounds(
          groupItem,
          debateRoundsByGroupOverride,
          debateRoundsOverride
        );
        const members = [...groupItem.members].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        for (let i = 1; i <= debateRounds; i++) {
          for (const m of members) {
            steps.push({
              id: `${groupKey}__${m.id}_r${i}`,
              text: `${m.text}（第${i}轮）`,
              // 透传分组级记忆配置与运行时覆盖（成员级在 createDebateRunFn 内覆盖）
              run: this.createDebateRunFn(
                groupKey,
                m,
                i,
                modelConfig,
                groupItem.memory,
                runtimeMemoryOverride
              ),
            });
          }
        }

        continue; // 下一个条目
      }

      // 分支2：普通步骤（AnalysisStepConfig）
      const cfg = item as AnalysisStepConfig;
      steps.push({
        id: cfg.id,
        text: cfg.text,
        run: async (state) => {
          const analyst = this.getAbility<AnalystAbility>(cfg.analyst);
          if (!analyst) throw new Error(`能力 '${cfg.analyst}' 未注册.`);
          // 统一向通用分析师传递最小必要参数，满足 AnalystAbility 的入参类型
          const payload: AnalystCommonProps = {
            company_of_interest: state.company_of_interest,
            trade_date: state.trade_date,
          };
          // 文件日志：记录普通步骤输入
          await this.logger.info("TradeAgent", "普通步骤输入", {
            stepId: cfg.id,
            text: cfg.text,
            analyst: cfg.analyst,
            inputs: ["company_of_interest", "trade_date"],
            state: payload,
          });
          const res = await analyst(payload);
          // 文件日志：记录普通步骤输出
          await this.logger.info("TradeAgent", "普通步骤输出", {
            stepId: cfg.id,
            analyst: cfg.analyst,
            rawResult: res,
          });
          return res as Partial<AgentState>;
        },
      });
    }

    return steps;
  }

  /**
   * 执行分析流程
   * @param input 包含股票代码的输入对象
   * @returns 返回一个包含所有分析步骤结果的数组
   */
  public async run(
    input: TradeAgentInput,
    options?: { signal?: AbortSignal }
  ): Promise<TradeAgentOutput> {
    this.log(`开始为股票 ${input.symbol} 进行分析...`);

    // 统一模型配置（供研究员与经理使用）
    const modelConfig: Model = {
      provider: "openrouter",
      model_name: "z-ai/glm-4.5-air:free",
      api_key: process.env.OPENROUTER_API_KEY,
    };

    // 初始化聚合状态（满足 AgentState 结构）
    const today = new Date().toISOString().split("T")[0];
    const initialState: AgentState = {
      company_of_interest: input.symbol,
      trade_date: today,
      sender: "TradeAgent",
      market_report: "",
      sentiment_report: "", // 目前无情绪分析步骤，先占位
      news_report: "",
      fundamentals_report: "",
      investment_debate_state: {
        history: [],
        count: 0,
      },
      investment_plan: "",
      trader_investment_plan: "",
      risk_debate_state: {
        risky_history: "",
        safe_history: "",
        neutral_history: "",
        history: "",
        latest_speaker: "",
        current_risky_response: "",
        current_safe_response: "",
        current_neutral_response: "",
        judge_decision: "",
        count: 0,
      },
      final_trade_decision: "",
      messages: [],
    };

    // 覆盖策略：优先使用按分组覆盖，其次使用全局覆盖；未提供则交由配置默认生效
    const debateRoundsByGroupOverride = input.debate_rounds_by_group;
    const debateRoundsOverride =
      typeof input.debate_rounds === "number" &&
      Number.isInteger(input.debate_rounds)
        ? Math.max(1, input.debate_rounds)
        : undefined;
    const steps = this.buildStepsFromConfig(
      debateRoundsByGroupOverride,
      debateRoundsOverride,
      modelConfig,
      input.memory_override
    );

    try {
      const results = await runStepsStateful<AgentState>(steps, initialState, {
        onProgress: (e) =>
          this.emitProgress({
            stepId: e.stepId,
            stepText: e.stepText,
            status: e.status,
            progress: e.progress,
            result: e.result,
            error: e.error,
          }),
        abortSignal: options?.signal,
      });

      this.log(`股票 ${input.symbol} 的分析完成.`);
      return results as TradeAgentOutput;
    } catch (err) {
      this.handleError(err);
    }
  }
}

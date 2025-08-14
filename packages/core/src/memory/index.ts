/**
 * @file 记忆模块
 * @description 负责存储和检索过去的经验教训。
 */

// 这是一个模拟的记忆记录类型，您可以根据需要进行扩展
interface MemoryRecord {
  situation: string;
  recommendation: string;
  timestamp: Date;
}

// 引入适配层以复用统一的记忆构建逻辑（收口到 adapters/memory）
import { buildPastMemories } from "../adapters/memory";
import { FileLogger } from "../utils/logger"; // 文件日志

// 内存模块日志器：输出至运行时 CWD 的 logs/memory.log（Next dev 下即 packages/web/logs）
const memoryLogger = new FileLogger("logs/memory.log");

/**
 * Memory 类负责管理和检索智能体的长期记忆。
 */
export class Memory {
  private records: MemoryRecord[];

  constructor() {
    // 在实际应用中，这里可能会从数据库或文件中加载记录
    this.records = [];
    // 文件日志：初始化
    void memoryLogger.info("Memory", "模块初始化", {
      records_count: this.records.length,
    });
  }

  /**
   * @description 根据当前情况检索最相关的 n 条记忆。
   *              当前的实现是一个简单的模拟，返回占位符数据。
   *              在实际应用中，这里应该使用向量相似度搜索等高级检索技术。
   * @param _current_situation 当前情况的描述字符串。
   * @param n_matches 需要检索的记忆条数。
   * @returns 返回一个包含记忆记录的数组。
   */
  public async get_memories(
    _current_situation: string,
    n_matches: number,
  ): Promise<{ recommendation: string }[]> {
    // 文件日志：输入
    await memoryLogger.info("Memory", "get_memories 输入", {
      situation_length: _current_situation.length,
      situation_preview: _current_situation.slice(0, 200),
      n_matches,
    });

    // TODO: 实现基于向量相似度的真实记忆检索逻辑
    // 目前返回模拟数据以供测试
    const results: { recommendation: string }[] = Array.from(
      { length: n_matches },
      (_, i) => ({
        recommendation: `这是第 ${i + 1} 条来自过去相似情况的模拟经验教训。`,
      }),
    );

    // 文件日志：输出
    await memoryLogger.info("Memory", "get_memories 输出", {
      count: results.length,
      recommendations_preview: results
        .slice(0, 3)
        .map((r) => r.recommendation.slice(0, 200)),
    });

    return results;
  }

  /**
   * @description 基于辩论的聊天历史构造统一的“过去记忆”字符串。
   *              内部委托给适配层 `buildPastMemories`，业务不直接依赖第三方。
   * @param history 辩论历史，需包含角色与文本。
   * @param memoryKey 业务侧定义的内存键（需与模板占位符一致）。
   * @returns 用于模板渲染的过去记忆字符串。
   */
  public async get_past_memories_from_history(
    history: { role: "human" | "ai"; content: string }[],
    memoryKey: string,
  ): Promise<string> {
    // 直接委托给适配层，传入 history 由适配层完成映射
    return buildPastMemories(history || [], memoryKey);
  }

  /**
   * @description 添加一条新的记忆记录。
   * @param record 要添加的记忆记录。
   */
  public async add_memory(record: MemoryRecord): Promise<void> {
    // 文件日志：新增记录输入（避免长文本，占位长度与预览）
    await memoryLogger.info("Memory", "add_memory 输入", {
      situation_length: record.situation.length,
      situation_preview: record.situation.slice(0, 200),
      recommendation_length: record.recommendation.length,
      recommendation_preview: record.recommendation.slice(0, 200),
      timestamp: record.timestamp.toISOString(),
    });
    this.records.push(record);
    // 在实际应用中，这里会将记录持久化到数据库
    // 文件日志：集合规模
    await memoryLogger.info("Memory", "add_memory 完成", {
      total_records: this.records.length,
    });
    return Promise.resolve();
  }
}

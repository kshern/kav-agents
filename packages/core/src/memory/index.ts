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

/**
 * Memory 类负责管理和检索智能体的长期记忆。
 */
export class Memory {
  private records: MemoryRecord[];

  constructor() {
    // 在实际应用中，这里可能会从数据库或文件中加载记录
    this.records = [];
    console.log("Memory module initialized.");
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
    console.log(`Retrieving ${n_matches} memories...`);
    // TODO: 实现基于向量相似度的真实记忆检索逻辑
    // 目前返回模拟数据以供测试
    return Promise.resolve(
      Array.from({ length: n_matches }, (_, i) => ({
        recommendation: `这是第 ${i + 1} 条来自过去相似情况的模拟经验教训。`,
      })),
    );
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
    console.log("Adding new memory:", record);
    this.records.push(record);
    // 在实际应用中，这里会将记录持久化到数据库
    return Promise.resolve();
  }
}

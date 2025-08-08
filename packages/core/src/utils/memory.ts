/**
 * @file 内存管理工具
 * @description 定义了用于管理对话历史的 Memory 类。
 */

/**
 * @interface ChatMessage
 * @description 定义了单条聊天消息的结构。
 */
export interface ChatMessage {
  /** 消息发送者的角色 */
  role: "user" | "model";
  /** 消息内容 */
  content: string;
}

/**
 * @class Memory
 * @description 用于存储和检索对话历史记录。
 */
export class Memory {
  private history: ChatMessage[] = [];

  /**
   * 向历史记录中添加一条新消息。
   *
   * @param message - 要添加的聊天消息。
   */
  addMessage(message: ChatMessage): void {
    this.history.push(message);
  }

  /**
   * 获取完整的对话历史记录。
   *
   * @returns - 返回包含所有消息的数组。
   */
  getHistory(): ChatMessage[] {
    return this.history;
  }

  /**
   * 清空对话历史。
   */
  clear(): void {
    this.history = [];
  }
}

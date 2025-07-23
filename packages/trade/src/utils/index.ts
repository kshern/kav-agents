import { getNestedValue } from "@core";

// 扩展 Window 接口，添加自定义方法
declare global {
  interface Window {
    getChatMessages: (messageId: string) => Promise<{data: {stat_data: unknown}}[]>;
    getCurrentMessageId: () => string;
  }
}

// 全局游戏数据存储
let globalGameData: unknown = null;

/**
 * 设置全局游戏数据
 * @param {any} data 游戏数据对象
 */
export function setGlobalGameData(data: unknown): void {
  globalGameData = data;
}

/**
 * 获取全局游戏数据
 * @returns {any} 全局游戏数据对象
 */
export function getGlobalGameData(): unknown {
  return globalGameData;
}

/**
 * 初始化全局游戏数据
 * 尝试从消息中获取数据，如果失败则使用默认数据
 */
export async function initGlobalGameData(): Promise<void> {
  try {
    // 这里保留了原来的获取逻辑，如果需要的话
    const messages = await window.getChatMessages(window.getCurrentMessageId());
    if (!messages || messages.length === 0 || !messages?.[0]?.data || !messages?.[0]?.data?.stat_data) {
      throw new Error("无法加载状态数据");
    }
    globalGameData = messages[messages.length - 1].data;

  } catch (error) {
    console.error("初始化全局游戏数据失败:", error);
    throw error;
  }
}
initGlobalGameData();

/**
 * @function getValue
 * @description 从全局游戏数据 (globalGameData) 中安全地获取一个嵌套值。
 * 这是对核心库中通用 getValue 函数的业务封装。
 * @param {string} [path] - 值的路径 (例如, 'a.b.c').
 * @returns {*} 找到的值或默认值。
 */
export function getValue(path?: string): unknown {
  if (!globalGameData) {
    console.warn("全局游戏数据未初始化，请先调用 initGlobalGameData()");
    return '';
  }

  // 调用核心库的通用函数，并传入全局数据作为数据源
  const result = getNestedValue(globalGameData, path);

  // 保留业务层特有的逻辑：如果结果是单元素数组，则返回其内容
  // 仅当提供了path时才执行此逻辑，避免当path为空时，对整个数据源进行解包
  if (path && Array.isArray(result) && result.length > 0) {
    return result[0];
  }

  return result;
}

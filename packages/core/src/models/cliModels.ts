/**
 * @file 定义命令行界面（CLI）所使用的模型。
 */

/**
 * 分析师类型枚举
 * @description 定义了系统中不同类型的分析师。
 */
export enum AnalystType {
  /** 市场分析师 */
  MARKET = 'market',
  /** 社交媒体分析师 */
  SOCIAL = 'social',
  /** 新闻分析师 */
  NEWS = 'news',
  /** 基本面分析师 */
  FUNDAMENTALS = 'fundamentals',
}

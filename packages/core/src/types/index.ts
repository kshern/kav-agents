/**
 * @file packages/core/src/types/index.ts
 * @description 核心共享类型定义
 */

/**
 * 定义了可以对游戏状态值执行的比较操作符。
 */
export type ConditionOperator =
  | 'eq'  // 等于
  | 'neq' // 不等于
  | 'gt'  // 大于
  | 'gte' // 大于或等于
  | 'lt'  // 小于
  | 'lte' // 小于或等于
  | 'contains' // 字符串或数组包含
  | '!contains'; // 字符串或数组不包含

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
  type: 'text';
}

/**
 * @interface ProgressProperty
 * @description 进度条类型的属性
 */
export interface ProgressProperty extends BaseProperty {
  /** 类型标识 */
  type: 'progress';
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
  type: 'metro-line';
}

/**
 * @interface BooleanProperty
 * @description 布尔类型的属性
 */
export interface BooleanProperty extends BaseProperty {
  /** 类型标识 */
  type: 'boolean';
}

/**
 * @interface NumberProperty
 * @description 数字类型的属性
 */
export interface NumberProperty extends BaseProperty {
  /** 类型标识 */
  type: 'number';
  /** 数字到文本的映射 */
  mapping?: Record<string, string>;
}

/**
 * @interface ActionProperty
 * @description 动作类型的属性
 */
export interface ActionProperty extends BaseProperty {
  /** 类型标识，固定为 'action' */
  type: 'action';
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
  effects: Record<string, {
    base_value_change: number;
  }>;
}

// 可辨识联合类型，涵盖所有可能的属性类型
export type Property =
  | TextProperty
  | ProgressProperty
  | MetroLineProperty
  | BooleanProperty
  | NumberProperty
  | ActionProperty;

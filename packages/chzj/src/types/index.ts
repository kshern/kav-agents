import type { Property } from '@core/types';

export interface Station {
  name: string;
}

/**
 * @interface SectionConfig
 * @description UI区域的配置
 */
export interface SectionConfig {
  /** 区域标题 */
  title: string;
  /** 是否可折叠 */
  collapsible: boolean;
  /** 当前是否展开 */
  isExpanded: boolean;
  /** 自定义CSS类名 */
  className: string;
  /** 是否显示进度条（此字段可能需要根据新结构重新评估） */
  progress?: boolean;
  /** 配置项列表，包含所有类型的属性 */
  properties: Property[];
}

export interface CardConfig {
  characterName: string;
  sections: SectionConfig[];
}

export interface GameData {
  [key: string]: unknown;
}



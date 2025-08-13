import React from "react";
import StartAnalysis from "@/features/stock-analysis/StartAnalysis";
// 页面布局采用 module.scss + classnames/bind
import classnames from 'classnames/bind';
import styles from './index.module.scss';
const cn = classnames.bind(styles);

/**
 * 股票分析页面
 * 仅负责渲染主组件，所有业务逻辑已封装在features目录
 */
export default function StockAnalysisPage() {
  return (
    <div className={cn('analysisWrapper')}>
      <StartAnalysis />
    </div>
  );
}

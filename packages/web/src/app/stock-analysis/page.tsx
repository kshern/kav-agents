"use client";

import React from 'react';
import StockAnalysis from '@/features/stock-analysis';

/**
 * 股票分析页面
 * 仅负责渲染主组件，所有业务逻辑已封装在features目录
 */
export default function StockAnalysisPage() {
    return <StockAnalysis />;
}

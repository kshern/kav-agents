import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { AnalysisReportProps } from '@/types';

/**
 * 分析报告组件
 * 显示股票分析的最终结果报告
 */
const AnalysisReport: React.FC<AnalysisReportProps> = ({ stockCode, onReset }) => {
    return (
        <div className="space-y-6">
            {/* 报告标题 */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">分析报告: {stockCode}</h2>
                <p className="text-sm text-gray-500">生成于: {new Date().toLocaleString('zh-CN')}</p>
            </div>
            
            {/* 报告内容 */}
            <div className="p-6 bg-gray-50 rounded-lg border prose max-w-none">
                <h3 className="font-bold">摘要</h3>
                <p>根据对 <strong>{stockCode}</strong> 的综合分析，我们发现该公司基本面稳健，近期技术指标显示出积极信号。市场情绪乐观，但需注意宏观经济波动带来的潜在风险。</p>
                
                <h3 className="font-bold mt-4">关键指标</h3>
                <ul>
                    <li><strong>市盈率 (P/E):</strong> 25.4x (行业平均: 22.1x)</li>
                    <li><strong>股息率:</strong> 1.8%</li>
                    <li><strong>技术趋势:</strong> 50日均线向上穿越200日均线，形成"黄金交叉"。</li>
                </ul>
            </div>
            
            {/* 重置按钮 */}
            <Button onClick={onReset} className="text-lg py-6 bg-gray-600 text-white hover:bg-gray-700">
                <RefreshCw className="mr-2 h-5 w-5" />
                分析新的股票
            </Button>
        </div>
    );
};

export default AnalysisReport;

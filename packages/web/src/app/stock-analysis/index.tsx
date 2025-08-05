import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StockInputForm from '../../components/StockInputForm';
import ProgressTracker from '../../components/ProgressTracker';
import AnalysisReport from '../../components/AnalysisReport';
import { useStockAnalysis } from '../../hooks/useStockAnalysis';

/**
 * 股票分析功能主组件
 * 整合所有子组件和业务逻辑
 */
const StockAnalysis: React.FC = () => {
    const { status, stockCode, steps, progress, handleStartAnalysis, handleReset } = useStockAnalysis();

    // 根据状态渲染不同内容
    const renderContent = () => {
        switch (status) {
            case 'processing':
                return <ProgressTracker steps={steps} overallProgress={progress} />;
            case 'complete':
                return <AnalysisReport stockCode={stockCode} onReset={handleReset} />;
            case 'idle':
            default:
                return <StockInputForm onSubmit={handleStartAnalysis} isLoading={false} />;
        }
    };

    return (
        <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-bold">智能分析 Agent</CardTitle>
                    <CardDescription className="text-center">输入代码，启动AI为您生成深度分析报告</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
};

export default StockAnalysis;

// 导出所有组件和钩子，便于其他地方使用
export { default as StockInputForm } from '../../components/StockInputForm';
export { default as ProgressTracker } from '../../components/ProgressTracker';
export { default as AnalysisReport } from '../../components/AnalysisReport';
export { useStockAnalysis } from '../../hooks/useStockAnalysis';
export * from '../../types';

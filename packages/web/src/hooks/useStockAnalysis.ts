import { useState, useMemo } from 'react';
import { Database, LineChart } from 'lucide-react';
import { TradeAgent } from '@kav/core';
import { AnalysisStatus, AnalysisStep, StepStatus, StockAnalysisHook } from '../types';

/**
 * 初始分析步骤
 */
const initialAnalysisSteps: Omit<AnalysisStep, 'status'>[] = [
    { id: 'analyze_fundamentals', text: '分析公司基本面', icon: Database },
    { id: 'analyze_market', text: '分析市场环境', icon: LineChart },
];

/**
 * 股票分析Hook
 * 管理分析状态、进度和步骤，通过 TradeAgent 驱动分析流程
 */
export function useStockAnalysis(): StockAnalysisHook {
    // 状态管理
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [stockCode, setStockCode] = useState('');
    const [steps, setSteps] = useState<AnalysisStep[]>(
        initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus }))
    );
    const [progress, setProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<unknown[]>([]);

    // 使用 useMemo 缓存 TradeAgent 实例，避免不必要的重渲染
    const tradeAgent = useMemo(() => new TradeAgent(), []);

    /**
     * 开始分析
     * @param code 股票代码
     */
    const handleStartAnalysis = async (code: string) => {
        setStockCode(code);
        setStatus('processing');
        setProgress(0);
        setSteps(initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus })));
        setAnalysisResult([]);

        try {
            // 模拟步骤进行中的状态更新
            const totalSteps = initialAnalysisSteps.length;
            for (let i = 0; i < totalSteps; i++) {
                setSteps(prev => prev.map((s, idx) => 
                    idx === i ? { ...s, status: 'in-progress' as StepStatus } : s
                ));
                // 实际项目中，可以根据 Agent 的回调来更新UI
                // 这里为了简化，我们假设每个步骤耗时平均
            }

            // 调用 TradeAgent 执行分析
            const results = await tradeAgent.run({ symbol: code });
            setAnalysisResult(results);

            // 根据 Agent 返回的结果更新最终状态
            setSteps(prev => prev.map(step => {
                const result = results.find(r => r.id === step.id);
                return {
                    ...step,
                    status: result ? 'completed' : 'error',
                };
            }));

            setProgress(100);
            setStatus('complete');

        } catch (error) {
            console.error("分析过程中发生错误:", error);
            setStatus('error');
            // 将所有正在进行的步骤标记为错误
            setSteps(prev => prev.map(s => 
                s.status === 'in-progress' ? { ...s, status: 'error' } : s
            ));
        }
    };

    /**
     * 重置分析
     */
    const handleReset = () => {
        setStatus('idle');
        setStockCode('');
        setProgress(0);
        setSteps(initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus })));
        setAnalysisResult([]);
    };

    return {
        status,
        stockCode,
        steps,
        progress,
        analysisResult,
        handleStartAnalysis,
        handleReset
    };
}

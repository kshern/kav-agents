import { useState, useEffect } from 'react';
import { Database, LineChart, Users, FilePen } from 'lucide-react';
import { AnalysisStatus, AnalysisStep, StepStatus, StockAnalysisHook } from '../types';

/**
 * 初始分析步骤
 */
const initialAnalysisSteps = [
    { id: 'fetch_data', text: '获取公司基本数据', icon: Database },
    { id: 'analyze_financials', text: '分析财务报表', icon: Database },
    { id: 'analyze_technicals', text: '执行技术指标分析', icon: LineChart },
    { id: 'analyze_sentiment', text: '评估市场情绪', icon: Users },
    { id: 'generate_report', text: '生成最终报告', icon: FilePen },
];

/**
 * 股票分析Hook
 * 管理分析状态、进度和步骤
 */
export function useStockAnalysis(): StockAnalysisHook {
    // 状态管理
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [stockCode, setStockCode] = useState('');
    const [steps, setSteps] = useState<AnalysisStep[]>(
        initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus }))
    );
    const [progress, setProgress] = useState(0);

    // 分析模拟效果
    useEffect(() => {
        if (status !== 'processing') return;

        let isCancelled = false;
        
        const runSimulation = async () => {
            const totalSteps = initialAnalysisSteps.length;
            
            for (let i = 0; i < totalSteps; i++) {
                if (isCancelled) return;

                // 更新当前步骤为进行中
                setSteps(prev => prev.map((s, idx) => 
                    idx === i ? { ...s, status: 'in-progress' as StepStatus } : s
                ));

                // 模拟异步工作
                await new Promise(resolve => setTimeout(resolve, 1200));
                if (isCancelled) return;

                // 更新当前步骤为已完成
                setSteps(prev => prev.map((s, idx) => 
                    idx === i ? { ...s, status: 'completed' as StepStatus } : s
                ));
                
                // 更新总体进度
                setProgress(((i + 1) / totalSteps) * 100);
            }
            
            // 完成分析
            setStatus('complete');
        };

        runSimulation();

        return () => {
            isCancelled = true;
        };
    }, [status]);

    /**
     * 开始分析
     * @param code 股票代码
     */
    const handleStartAnalysis = (code: string) => {
        setStockCode(code);
        setStatus('processing');
    };

    /**
     * 重置分析
     */
    const handleReset = () => {
        setStatus('idle');
        setStockCode('');
        setProgress(0);
        setSteps(initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus })));
    };

    return {
        status,
        stockCode,
        steps,
        progress,
        handleStartAnalysis,
        handleReset
    };
}

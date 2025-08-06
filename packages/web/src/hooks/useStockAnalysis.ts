import { useState, useEffect } from 'react';
import { Database, LineChart, Users, FilePen } from 'lucide-react';
import { AnalysisStatus, AnalysisStep, StepStatus, StockAnalysisHook } from '../types';

/**
 * API 请求参数接口
 */
interface AnalysisApiRequest {
    company_of_interest: string;
    trade_date: string;
}

/**
 * 初始分析步骤
 */
const initialAnalysisSteps = [
    { id: 'analyze_fundamentals', text: '分析公司基本面', icon: Database },
    // { id: 'analyze_market', text: '分析市场环境', icon: LineChart },
    // { id: 'analyze_news', text: '分析相关新闻', icon: Users },
    // { id: 'manage_research', text: '生成投资研究报告', icon: FilePen },
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

    // 真实分析流程
    useEffect(() => {
        if (status !== 'processing') return;

        let isCancelled = false;
        
        const runAnalysis = async () => {
            const totalSteps = initialAnalysisSteps.length;
            
            // 构建 API 请求参数
            const apiRequest: AnalysisApiRequest = {
                company_of_interest: stockCode,
                trade_date: new Date().toISOString().split('T')[0] // 当前日期
            };
            
            for (let i = 0; i < totalSteps; i++) {
                if (isCancelled) return;

                const currentStep = initialAnalysisSteps[i];
                
                // 更新当前步骤为进行中
                setSteps(prev => prev.map((s, idx) => 
                    idx === i ? { ...s, status: 'in-progress' as StepStatus } : s
                ));

                try {
                    // 根据步骤 ID 调用对应的 API
                    await callApiForStep(currentStep.id, apiRequest);
                    
                    if (isCancelled) return;

                    // 更新当前步骤为已完成
                    setSteps(prev => prev.map((s, idx) => 
                        idx === i ? { ...s, status: 'completed' as StepStatus } : s
                    ));
                } catch (error) {
                    console.error(`步骤 ${currentStep.text} 执行失败:`, error);
                    
                    // 更新当前步骤为失败
                    setSteps(prev => prev.map((s, idx) => 
                        idx === i ? { ...s, status: 'error' as StepStatus } : s
                    ));
                    
                    setStatus('error');
                    return;
                }
                
                // 更新总体进度
                setProgress(((i + 1) / totalSteps) * 100);
            }
            
            // 完成分析
            setStatus('complete');
        };

        runAnalysis();

        return () => {
            isCancelled = true;
        };
    }, [status, stockCode]);

    /**
     * 根据步骤 ID 调用对应的 API
     * @param stepId 步骤标识符
     * @param request API 请求参数
     */
    const callApiForStep = async (stepId: string, request: AnalysisApiRequest): Promise<void> => {
        const apiEndpoints: Record<string, string> = {
            'analyze_fundamentals': '/api/analyzeFundamentals',
            'analyze_market': '/api/analyzeMarket',
            'analyze_news': '/api/analyzeNews',
            'manage_research': '/api/manageResearch'
        };

        const endpoint = apiEndpoints[stepId];
        if (!endpoint) {
            throw new Error(`未知的分析步骤: ${stepId}`);
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`${stepId} 分析结果:`, result);
        
        // 这里可以根据需要存储分析结果
        // 例如：setAnalysisResults(prev => ({ ...prev, [stepId]: result }));
    };

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

import { useState, useEffect, useCallback } from 'react';
import { Database, LineChart, Users, FilePen, BotMessageSquare, BrainCircuit } from 'lucide-react';
import { AnalysisStatus, AnalysisStep, StepStatus, StockAnalysisHook } from '../types';

/**
 * @constant initialAnalysisSteps
 * @description 定义了分析流程的初始步骤，用于在UI上展示。
 */
const initialAnalysisSteps: Omit<AnalysisStep, 'status'>[] = [
  { id: 'research', text: '研究市场与竞品', icon: Database },
  { id: 'analyze', text: '多维度综合分析', icon: LineChart },
  { id: 'debate', text: '多视角风险辩论', icon: Users },
  { id: 'plan', text: '生成交易计划', icon: FilePen },
  { id: 'manage', text: '执行与风险管理', icon: BrainCircuit },
  { id: 'report', text: '生成决策报告', icon: BotMessageSquare },
];

/**
 * @function useStockAnalysis
 * @description 管理股票分析流程的状态、进度和步骤的 React Hook。
 * @returns {StockAnalysisHook} 返回分析状态、股票代码、步骤、进度以及控制分析流程的函数。
 */
export function useStockAnalysis(): StockAnalysisHook {
  // 状态管理
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [stockCode, setStockCode] = useState('');
  const [steps, setSteps] = useState<AnalysisStep[]>(
    initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus }))
  );
  const [progress, setProgress] = useState(0);

  /**
   * @function callAgentApi
   * @description 调用后端 Agent API 来执行完整的分析流程。
   * @param {string} code - 股票代码。
   * @returns {Promise<unknown>} 返回 API 的 JSON 响应。
   */
  const callAgentApi = async (code: string): Promise<unknown> => {
    const response = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol: code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API 调用失败: ${response.status}`);
    }

    return response.json();
  };

  // 使用 useCallback 优化事件处理器
  const handleStartAnalysis = useCallback((code: string) => {
    setStockCode(code);
    setStatus('processing');
    setProgress(0);
    setSteps(initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus })));
  }, []);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setStockCode('');
    setProgress(0);
    setSteps(initialAnalysisSteps.map(step => ({ ...step, status: 'pending' as StepStatus })));
  }, []);

  // 主分析流程
  useEffect(() => {
    if (status !== 'processing' || !stockCode) return;

    let isCancelled = false;

    const runAnalysis = async () => {
      try {
        // 模拟前端进度条更新，给用户即时反馈
        const totalSteps = steps.length;
        for (let i = 0; i < totalSteps; i++) {
          if (isCancelled) return;
          // 更新当前步骤为进行中
          setSteps(prev =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'in-progress' as StepStatus } : s))
          );
          // 模拟耗时
          await new Promise(resolve => setTimeout(resolve, 500));
          if (isCancelled) return;
          // 更新当前步骤为完成
          setSteps(prev =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'completed' as StepStatus } : s))
          );
          setProgress(((i + 1) / totalSteps) * 100);
        }

        // 实际调用后端 Agent，这期间前端进度条已经走完
        console.log(`[useStockAnalysis] 正在为 ${stockCode} 调用 Agent...`);
        const result = await callAgentApi(stockCode);
        console.log(`[useStockAnalysis] Agent 返回结果:`, result);

        if (!isCancelled) {
          setStatus('complete');
        }
      } catch (error) {
        console.error('[useStockAnalysis] 分析流程执行失败:', error);
        if (!isCancelled) {
          setStatus('error');
          // 将所有未完成的步骤标记为错误
          setSteps(prev =>
            prev.map(s => (s.status !== 'completed' ? { ...s, status: 'error' as StepStatus } : s))
          );
        }
      }
    };

    runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [status, stockCode, steps.length]);

  return {
    status,
    stockCode,
    steps,
    progress,
    handleStartAnalysis,
    handleReset,
  };
}

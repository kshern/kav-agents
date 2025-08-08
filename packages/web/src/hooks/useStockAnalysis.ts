import { useState, useRef, useEffect } from 'react';
import { Database, LineChart } from 'lucide-react';
import { AnalysisStatus, AnalysisStep, StepStatus, StockAnalysisHook } from '../types';

// 定义进度事件类型（与后端保持一致）
interface ProgressEvent {
  stepId: string;
  stepText: string;
  status: 'started' | 'completed' | 'error';
  progress: number;
  result?: unknown;
  error?: string;
}

// 定义后端步骤配置类型
interface AnalysisStepConfig {
  id: string;
  text: string;
  analyst: string;
}

// 步骤图标映射
const STEP_ICONS: Record<string, React.ComponentType> = {
  'analyze_fundamentals': Database,
  'analyze_market': LineChart,
};

/**
 * 股票分析Hook
 * 管理分析状态、进度和步骤，通过 TradeAgent 驱动分析流程
 */
export function useStockAnalysis(): StockAnalysisHook {
    // 状态管理
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [stockCode, setStockCode] = useState('');
    const [steps, setSteps] = useState<AnalysisStep[]>([]);
    const [progress, setProgress] = useState(0);
    const [isStepsLoaded, setIsStepsLoaded] = useState(false);
    
    // 使用 useRef 保存 EventSource 实例
    const eventSourceRef = useRef<EventSource | null>(null);

    /**
     * 从后端获取分析步骤配置
     */
    const loadAnalysisSteps = async () => {
        try {
            const response = await fetch('/api/analysis/steps');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const { success, data } = await response.json();
            if (success && data) {
                // 将后端配置转换为前端步骤格式
                const frontendSteps: AnalysisStep[] = data.map((stepConfig: AnalysisStepConfig) => ({
                    id: stepConfig.id,
                    text: stepConfig.text,
                    icon: STEP_ICONS[stepConfig.id] || Database, // 默认图标
                    status: 'pending' as StepStatus,
                }));
                
                setSteps(frontendSteps);
                setIsStepsLoaded(true);
            }
        } catch (error) {
            console.error('加载分析步骤配置失败:', error);
            // 使用默认配置作为降级方案
            setSteps([
                { id: 'analyze_fundamentals', text: '分析公司基本面', icon: Database, status: 'pending' },
                { id: 'analyze_market', text: '分析市场环境', icon: LineChart, status: 'pending' },
            ]);
            setIsStepsLoaded(true);
        }
    };

    // 组件初始化时加载步骤配置
    useEffect(() => {
        loadAnalysisSteps();
    }, []);

    /**
     * 处理进度事件
     * @param event 进度事件数据
     */
    const handleProgressEvent = (event: ProgressEvent) => {
        console.log('收到进度事件:', event);

        // 更新进度
        setProgress(event.progress);

        // 根据事件类型更新步骤状态
        if (event.stepId === 'final') {
            // 最终完成事件
            setStatus('complete');

        } else if (event.stepId === 'error') {
            // 全局错误事件
            setStatus('error');
            console.error('分析失败:', event.error);
        } else {
            // 单个步骤事件
            setSteps(prev => prev.map(step => {
                if (step.id === event.stepId) {
                    let newStatus: StepStatus;
                    switch (event.status) {
                        case 'started':
                            newStatus = 'in-progress';
                            break;
                        case 'completed':
                            newStatus = 'completed';
                            break;
                        case 'error':
                            newStatus = 'error';
                            break;
                        default:
                            newStatus = step.status;
                    }
                    return { ...step, status: newStatus };
                }
                return step;
            }));
        }
    };

    /**
     * 开始分析
     * @param code 股票代码
     */
    const handleStartAnalysis = async (code: string) => {
        // 确保步骤配置已加载
        if (!isStepsLoaded) {
            console.warn('分析步骤配置尚未加载完成');
            return;
        }

        // 如果已有连接，先关闭
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setStockCode(code);
        setStatus('processing');
        setProgress(0);
        // 重置所有步骤状态为 pending
        setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus })));

        try {
            // 直接创建 EventSource 连接，使用 GET 方式传递股票代码
            const eventSource = new EventSource(`/api/analysis/stream?symbol=${encodeURIComponent(code)}`);
            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event) => {
                try {
                    const progressEvent: ProgressEvent = JSON.parse(event.data);
                    handleProgressEvent(progressEvent);
                } catch (error) {
                    console.error('解析进度事件失败:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource 连接错误:', error);
                setStatus('error');
                eventSource.close();
            };

            eventSource.onopen = () => {
                console.log('EventSource 连接已建立');
            };

        } catch (error) {
            console.error('启动分析失败:', error);
            setStatus('error');
        }
    };

    /**
     * 重置分析
     */
    const handleReset = () => {
        // 关闭 EventSource 连接
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setStatus('idle');
        setStockCode('');
        setProgress(0);
        // 重置所有步骤状态为 pending
        setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus })));
    };

    return {
        status,
        stockCode,
        steps,
        progress,
        isStepsLoaded, // 新增：步骤加载状态
        handleStartAnalysis,
        handleReset
    };
}

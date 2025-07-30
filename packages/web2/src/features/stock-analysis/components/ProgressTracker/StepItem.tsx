import React, { useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepItemProps } from '../../types';

/**
 * 步骤项组件
 * 用于显示分析流程中的单个步骤及其状态
 */
const StepItem: React.FC<StepItemProps> = ({ step, status, isLast }) => {
    // 根据状态动态选择图标
    const Icon = useMemo(() => {
        if (status === 'in-progress') return Loader2;
        if (status === 'completed') return Check;
        return step.icon;
    }, [status, step.icon]);

    return (
        <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
                {/* 步骤图标 */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                    status === 'pending' && 'bg-gray-200 text-gray-500',
                    status === 'in-progress' && 'bg-blue-500 text-white',
                    status === 'completed' && 'bg-green-500 text-white',
                )}>
                    <Icon className={cn("h-5 w-5", status === 'in-progress' && 'animate-spin')} />
                </div>
                
                {/* 连接线（非最后一项才显示） */}
                {!isLast && <div className={cn(
                    "line h-full w-0.5 mt-1 transition-colors duration-300",
                    status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                )}></div>}
            </div>
            
            {/* 步骤文本 */}
            <div className="pt-1.5">
                <p className="font-semibold text-gray-800">{step.text}</p>
            </div>
        </div>
    );
};

export default StepItem;

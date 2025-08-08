import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressTrackerProps } from "@/types";
import StepItem from "./StepItem";

/**
 * 进度跟踪器组件
 * 显示整体分析进度和各步骤状态
 */
const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  overallProgress,
}) => {
  // 获取当前正在进行的步骤文本
  const currentStepText = useMemo(() => {
    const currentStep = steps.find((s) => s.status === "in-progress");
    return currentStep
      ? currentStep.text
      : overallProgress === 100
        ? "分析完成"
        : "正在初始化...";
  }, [steps, overallProgress]);

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-base font-medium text-blue-700">
            {currentStepText}
          </span>
          <span className="text-sm font-medium text-blue-700">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} />
      </div>

      {/* 步骤列表 */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            status={step.status}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;

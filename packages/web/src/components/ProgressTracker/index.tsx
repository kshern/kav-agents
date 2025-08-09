import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressTrackerProps } from "@/types";
import StepItem from "./StepItem";
import DebateProgress from "./DebateProgress";

/**
 * 进度跟踪器组件
 * 显示整体分析进度和各步骤状态
 */
const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, overallProgress }) => {
  const isDebate = (id: string) => /_r\d+$/i.test(id);

  // 非辩论步骤（用于顶部进度与普通步骤列表）
  const nonDebateSteps = useMemo(() => steps.filter((s) => !isDebate(s.id)), [steps]);

  // 计算仅基于非辩论步骤的总体进度与当前提示文案
  const { topPercent, currentStepText } = useMemo(() => {
    const total = nonDebateSteps.length || 1;
    const done = nonDebateSteps.filter((s) => s.status === "completed").length;
    const percent = Math.round((done / total) * 100);
    const inprog = nonDebateSteps.find((s) => s.status === "in-progress");

    // 若非辩论没有 in-progress，但存在辩论在进行，则给出统一提示
    const hasDebateInProgress = steps.some((s) => isDebate(s.id) && s.status === "in-progress");
    const label = inprog
      ? inprog.text
      : percent === 100
        ? "分析完成"
        : hasDebateInProgress
          ? "正在进行辩论..."
          : "正在初始化...";

    return { topPercent: percent, currentStepText: label };
  }, [nonDebateSteps, steps]);

  // 定位第一次与最后一次辩论步骤，用于将 DebateProgress 内嵌在整体序列中
  const firstDebateIndex = useMemo(() => steps.findIndex((s) => isDebate(s.id)), [steps]);
  const lastDebateIndex = useMemo(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (isDebate(steps[i].id)) return i;
    }
    return -1;
  }, [steps]);

  const beforeDebate = useMemo(
    () => (firstDebateIndex === -1 ? nonDebateSteps : steps.slice(0, firstDebateIndex).filter((s) => !isDebate(s.id))),
    [firstDebateIndex, nonDebateSteps, steps],
  );
  const afterDebate = useMemo(
    () => (lastDebateIndex === -1 ? [] : steps.slice(lastDebateIndex + 1).filter((s) => !isDebate(s.id))),
    [lastDebateIndex, steps],
  );

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm md:text-base font-medium text-muted-foreground">
            {currentStepText}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={topPercent} />
      </div>

      {/* 步骤列表 */}
      <div className="space-y-2">
        {/* 辩论前的非辩论步骤 */}
        {beforeDebate.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            status={step.status}
            isLast={firstDebateIndex === -1 ? index === beforeDebate.length - 1 : false}
          />
        ))}

        {/* 在整体序列中插入辩论进度（若存在） */}
        {firstDebateIndex !== -1 && <DebateProgress steps={steps} />}

        {/* 辩论后的非辩论步骤 */}
        {afterDebate.map((step, i) => (
          <StepItem
            key={step.id}
            step={step}
            status={step.status}
            isLast={i === afterDebate.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;

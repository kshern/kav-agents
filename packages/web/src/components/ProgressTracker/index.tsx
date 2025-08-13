import React, { useMemo } from "react";
import classnames from "classnames/bind"; // 引入绑定工具，统一根容器样式
import styles from "./index.module.scss"; // 组件级样式模块：根容器与步骤容器间距
import { Progress } from "@/components/ui/progress";
import { ProgressTrackerProps } from "@/types";
import StepItem from "./StepItem";
import DebateProgress from "./DebateProgress";
import { FileText } from "lucide-react";

/**
 * 进度跟踪器组件
 * 显示整体分析进度和各步骤状态
 */
const cn = classnames.bind(styles);

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, overallProgress }) => {
  const isDebate = (id: string) => /_r\d+$/i.test(id);

  // 非辩论步骤（用于顶部进度与普通步骤列表）
  const nonDebateSteps = useMemo(() => steps.filter((s) => !isDebate(s.id)), [steps]);

  // 计算顶部提示文案（非辩论步骤驱动文案），进度条使用 overallProgress 与 Hook 保持一致
  const currentStepText = useMemo(() => {
    const total = nonDebateSteps.length || 1;
    const done = nonDebateSteps.filter((s) => s.status === "completed").length;
    const percent = Math.round((done / total) * 100);
    const inprog = nonDebateSteps.find((s) => s.status === "in-progress");

    // 若非辩论没有 in-progress，但存在辩论在进行，则给出统一提示
    const hasDebateInProgress = steps.some((s) => isDebate(s.id) && s.status === "in-progress");
    return inprog
      ? inprog.text
      : percent === 100
        ? "分析完成"
        : hasDebateInProgress
          ? "正在进行辩论..."
          : "正在初始化...";
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

  // 是否展示“查看报告”步骤（仅 UI，不绑定点击事件）
  const showViewReport = useMemo(() => Math.round(overallProgress) >= 100, [overallProgress]);

  return (
    // 根容器的竖向间距交给 SCSS Module
    <div className={cn("root")}>
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
        <Progress value={overallProgress} />
      </div>

      {/* 步骤列表 */}
      <div className={cn("steps")}>
        {/* 辩论前的非辩论步骤 */}
        {beforeDebate.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            status={step.status}
            // 若无辩论且需要展示“查看报告”步骤，则这里不应标记为最后一项
            isLast={firstDebateIndex === -1 ? (showViewReport ? false : index === beforeDebate.length - 1) : false}
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
            // 若后续还要展示“查看报告”步骤，则这里不应标记为最后一项
            isLast={showViewReport ? false : i === afterDebate.length - 1}
          />
        ))}

        {/* 分析完成后显示“查看报告”步骤（仅 UI，保持美观一致） */}
        {showViewReport && (
          <div className="mt-4 pt-4 border-t">
            <StepItem
              step={{ id: "view_report", text: "查看报告", icon: FileText }}
              status="completed"
              isLast={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;

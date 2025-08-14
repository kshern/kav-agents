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

  // 顶部提示文案：优先显示非辩论 in-progress 文案，否则根据状态提示
  const currentStepText = useMemo(() => {
    const nonDebate = steps.filter((s) => !isDebate(s.id));
    const total = nonDebate.length || 1;
    const done = nonDebate.filter((s) => s.status === "completed").length;
    const percent = Math.round((done / total) * 100);
    const inprog = nonDebate.find((s) => s.status === "in-progress");
    const hasDebateInProgress = steps.some((s) => isDebate(s.id) && s.status === "in-progress");
    return inprog
      ? inprog.text
      : percent === 100
        ? "分析完成"
        : hasDebateInProgress
          ? "正在进行辩论..."
          : "正在初始化...";
  }, [steps]);

  // 将步骤切分为顺序段：连续的辩论块与普通块
  const segments = useMemo(() => {
    type Segment = { kind: "debate" | "normal"; items: typeof steps };
    const list: Segment[] = [];
    let buf: typeof steps = [];
    let bufKind: "debate" | "normal" | null = null;
    for (const s of steps) {
      const k: "debate" | "normal" = isDebate(s.id) ? "debate" : "normal";
      if (bufKind === null) {
        bufKind = k;
        buf = [s];
        continue;
      }
      if (k === bufKind) {
        buf.push(s);
      } else {
        list.push({ kind: bufKind, items: buf });
        bufKind = k;
        buf = [s];
      }
    }
    if (bufKind !== null) list.push({ kind: bufKind, items: buf });
    return list;
  }, [steps]);

  // 是否展示“查看报告”步骤（仅 UI，不绑定点击事件）
  const showViewReport = useMemo(() => Math.round(overallProgress) >= 100, [overallProgress]);

  // 计算所有普通步骤的总数，用于确定最后一项的连线收尾
  const normalTotalCount = useMemo(
    () => segments.filter((seg) => seg.kind === "normal").reduce((acc, seg) => acc + seg.items.length, 0),
    [segments],
  );

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

      {/* 步骤列表（顺序渲染分段，保留两个辩论之间的普通步骤） */}
      <div className={cn("steps")}>
        {(() => {
          let renderedNormal = 0; // 已渲染的普通项数量
          return segments.map((seg, segIdx) => {
            if (seg.kind === "debate") {
              // 仅将该连续辩论块传入，从而在 Debates 分开后仍保持原始顺序
              return <DebateProgress key={`debate-seg-${segIdx}`} steps={seg.items} />;
            }
            // 普通块：逐项渲染 StepItem
            return (
              <React.Fragment key={`normal-seg-${segIdx}`}>
                {seg.items.map((step, idx) => {
                  renderedNormal += 1;
                  const isLast = !showViewReport && renderedNormal === normalTotalCount;
                  return (
                    <StepItem
                      key={step.id}
                      step={step}
                      status={step.status}
                      isLast={isLast}
                    />
                  );
                })}
              </React.Fragment>
            );
          });
        })()}

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

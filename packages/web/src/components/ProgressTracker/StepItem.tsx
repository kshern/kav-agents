import React, { useMemo } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepItemProps } from "@/types";

/**
 * 步骤项组件
 * 用于显示分析流程中的单个步骤及其状态
 */
const StepItem: React.FC<StepItemProps> = ({ step, status, isLast }) => {
  // 根据状态动态选择图标
  const Icon = useMemo(() => {
    if (status === "in-progress") return Loader2;
    if (status === "completed") return Check;
    return step.icon;
  }, [status, step.icon]);

  return (
    <div className="flex items-start group">
      <div className="flex flex-col items-center mr-4">
        {/* 步骤图标：带描边与光晕动效，提升质感 */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ring-1",
            status === "pending" && "bg-muted text-muted-foreground ring-border",
            status === "in-progress" && "bg-primary text-primary-foreground ring-primary/40 animate-glow",
            // A股语义：避免使用绿色表示完成，改用红色以免误解“绿=跌”
            status === "completed" && "bg-rose-500 text-white ring-rose-400",
            "group-hover:scale-[1.03]",
          )}
          title={step.text}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              status === "in-progress" && "animate-spin",
            )}
          />
        </div>

        {/* 连接线（非最后一项才显示）：根据状态切换颜色 */}
        {!isLast && (
          <div
            className={cn(
              "line h-full w-0.5 mt-1 transition-colors duration-300",
              // 完成态连线用红色，避免绿色
              status === "completed" ? "bg-rose-500" : status === "in-progress" ? "bg-primary/60" : "bg-muted",
            )}
          ></div>
        )}
      </div>

      {/* 步骤文本 */}
      <div className="pt-1.5">
        <p className="font-medium text-foreground text-sm md:text-base">{step.text}</p>
      </div>
    </div>
  );
}
;

export default StepItem;

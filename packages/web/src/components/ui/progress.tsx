"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        // 进度条轨道：高端质感，轻微玻璃态与描边
        "relative h-2.5 md:h-3 w-full overflow-hidden rounded-full border border-border/60 bg-background supports-[backdrop-filter]:bg-background/50 backdrop-blur",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // 指示器：动态渐变 + 闪动流光（shimmer）
        className={cn(
          "h-full w-full flex-1 transition-all",
          "bg-gradient-to-r from-primary via-primary/90 to-primary/70",
          // 让背景可移动以配合 shimmer 动画
          "bg-[length:200%_100%] animate-shimmer",
          // 轻微投影增强立体感
          "shadow-sm",
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

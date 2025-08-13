"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import classnames from "classnames/bind"; // 引入绑定工具
import styles from "./ThemeToggle.module.scss"; // 组件级样式模块

/**
 * 主题切换组件
 * 切换 html 上的 dark 类，并将用户选择持久化到 localStorage
 */
const cn = classnames.bind(styles);

const ThemeToggle: React.FC = () => {
  // 读取当前主题：优先 localStorage，其次系统偏好
  const getInitial = React.useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }, []);

  const [theme, setTheme] = React.useState<"light" | "dark">(getInitial);

  // 初始化与变更时，同步到 DOM 与 localStorage
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // 点击切换
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={theme === "dark" ? "切换为亮色" : "切换为暗色"}
      onClick={toggle}
      className={cn("toggleBtn")}
      title={theme === "dark" ? "切换为亮色" : "切换为暗色"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
};

export default ThemeToggle;

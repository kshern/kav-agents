 import type { Metadata } from "next";
import "./globals.css";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";
// 使用 classnames/bind 绑定本页面的模块化样式（仅用于页面级布局样式）
import classnames from "classnames/bind";
import styles from "./index.module.scss";
const cn = classnames.bind(styles);

export const metadata: Metadata = {
  title: "KAV Agents — 智能投研",
  description: "面向专业投资者的智能研究与分析助手",
};

 // 全站使用系统字体，见 globals.css 中的 --font-sans 配置

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* 页面级布局改为使用 module.scss 的样式类，仍保留字体等 Tailwind 工具类 */}
      <body className={`${cn('rootBody')} font-sans antialiased`}>{/* 使页面成为纵向弹性布局，避免 header 与内容相加超过一屏 */}
        {/* 顶部导航：显示登录状态与入口 + 主题切换 */}
        <header className={cn('header')}>
          <div className={cn('headerInner')}>
            <a href="/" className="font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">KAV Agents</a>
            <div className={cn('headerRight')}>
              <ThemeToggle />
              <AuthStatus />
            </div>
          </div>
        </header>
        <main className={cn('main')}>{/* main 占据除 header 外的剩余高度 */}
          {children}
        </main>
      </body>
    </html>
  );
}

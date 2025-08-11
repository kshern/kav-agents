 import type { Metadata } from "next";
import "./globals.css";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";

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
      <body className="min-h-screen font-sans antialiased">
        {/* 顶部导航：显示登录状态与入口 + 主题切换 */}
        <header className="sticky top-0 z-50 w-full border-b supports-[backdrop-filter]:bg-background/60 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">KAV Agents</a>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthStatus />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

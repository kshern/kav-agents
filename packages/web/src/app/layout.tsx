 import type { Metadata } from "next";
 import "./globals.css";
 import AuthStatus from "@/components/AuthStatus";

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
        {/* 顶部导航：显示登录状态与入口 */}
        <header className="w-full border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">KAV Agents</a>
            <AuthStatus />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

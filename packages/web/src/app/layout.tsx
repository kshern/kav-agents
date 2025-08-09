 import type { Metadata } from "next";
 import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}

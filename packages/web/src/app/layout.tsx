 import type { Metadata } from "next";
 import { Inter } from "next/font/google";
 import "./globals.css";

export const metadata: Metadata = {
  title: "KAV Agents — 智能投研",
  description: "面向专业投资者的智能研究与分析助手",
};

 // 使用 next/font 加载 Inter，避免自定义字体的 lint 警告
 const inter = Inter({
   subsets: ["latin"],
   weight: ["400", "500", "600", "700"],
   display: "swap",
 });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Study Hub",
    template: "%s - AI Study Hub"
  },
  description: "每天精选 AI 最新资讯、实战案例、工具教程和工作流。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

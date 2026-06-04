import type { Metadata } from "next";
import { SpaceBackground } from "@/components/SpaceBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Study Hub",
    template: "%s - AI Study Hub"
  },
  description: "精选中文 AI 工具文章、视频教程、项目案例、Skill 插件和工作流。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SpaceBackground />
        {children}
      </body>
    </html>
  );
}

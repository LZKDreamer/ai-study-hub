import latest from "@/data/latest.json";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type ToolRole = {
  name: string;
  role: string;
};

export type ArticleContent = {
  quote: string;
  originalContent: string[];
  sections: ArticleSection[];
  tools: ToolRole[];
};

export type ContentItem = {
  id: string;
  slug: string;
  type: string;
  category: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  relativeTime: string;
  title: string;
  summary: string;
  tags: string[];
  attentionLabel: string;
  attention: string;
  audience?: string;
  visualKind: "codex" | "research" | "image" | "skill" | "agent";
  featured?: boolean;
  article: ArticleContent;
};

export type LatestData = {
  date: string;
  updatedCount: number;
  items: ContentItem[];
};

const latestData = latest as LatestData;

export const filters = ["全部", "AI最新资讯", "实战案例", "工具教程", "工作流", "Skill/插件", "Codex"];

export function getLatestData() {
  return latestData;
}

export function getAllItems() {
  return latestData.items;
}

export function getItemBySlug(slug: string) {
  return latestData.items.find((item) => item.slug === slug);
}

export function getItemHref(item: ContentItem) {
  return `/cases/${item.slug}`;
}

export function getReadingMinutes(item: ContentItem) {
  const text = [
    item.title,
    item.summary,
    item.attention,
    item.article.quote,
    ...item.article.originalContent,
    ...item.article.sections.flatMap((section) => [section.heading, ...section.paragraphs])
  ].join("");

  return Math.max(4, Math.ceil(text.length / 420));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

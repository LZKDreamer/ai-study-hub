import latest from "@/data/latest.json";

export type SourceKind = "article" | "video" | "link";

export type ContentMetrics = {
  reads?: string;
  views?: string;
  likes?: string;
  stars?: string;
};

export type ContentItem = {
  id: string;
  slug: string;
  author: string;
  platform: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  youtubeVideoId?: string;
  channelId?: string;
  channelAvatarUrl?: string;
  originalTitle?: string;
  imageUrl?: string;
  publishedAt: string;
  title: string;
  summary: string;
  tags: string[];
  metrics?: ContentMetrics;
  featured?: boolean;
};

export type LatestData = {
  date: string;
  updatedCount: number;
  items: ContentItem[];
};

const latestData = latest as LatestData;

export function getLatestData() {
  return latestData;
}

export function getAllItems() {
  return latestData.items;
}

export function getItemHref(item: ContentItem) {
  return item.sourceUrl;
}

export function getLastUpdatedLabel(data: LatestData) {
  const [year, month, day] = data.date.split("-").map(Number);
  if (!year || !month || !day) return "每日 06:10";

  return `${year}年${month}月${day}日 06:10`;
}

export function formatPublishedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "发布时间未知";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

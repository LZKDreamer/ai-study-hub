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

export type CandidateType = "wechat" | "youtube" | "juejin" | "github" | "site" | "manual";

export type Candidate = {
  id: string;
  author: string;
  platform: string;
  sourceUrl: string;
  title: string;
  url: string;
  sourceKind: SourceKind;
  youtubeVideoId?: string;
  imageUrl?: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  candidateType: CandidateType;
  priority: number;
  metrics?: ContentMetrics;
};

export type VisualKind = "codex" | "research" | "image" | "skill" | "agent";

export type ContentType = "AI最新资讯" | "实战案例" | "工具教程" | "工作流" | "Skill/插件";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type ToolRole = {
  name: string;
  role: string;
};

export type ContentItem = {
  id: string;
  slug: string;
  type: ContentType;
  category: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  relativeTime: string;
  title: string;
  summary: string;
  tags: string[];
  attentionLabel: "为什么值得关注" | "解决什么问题";
  attention: string;
  audience?: string;
  visualKind: VisualKind;
  featured?: boolean;
  article: {
    quote: string;
    originalContent: string[];
    sections: ArticleSection[];
    tools: ToolRole[];
  };
};

export type LatestData = {
  date: string;
  updatedCount: number;
  items: ContentItem[];
};

export type CandidateType = "rss" | "github-release" | "github-trending" | "manual";

export type Candidate = {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  candidateType: CandidateType;
  priority: number;
};

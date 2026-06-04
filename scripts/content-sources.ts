import { XMLParser } from "fast-xml-parser";
import type { Candidate, CandidateType, SourceKind } from "./content-types";

type RssSource = {
  type: "rss";
  author: string;
  platform: string;
  url: string;
  tags: string[];
  priority: number;
  sourceKind?: SourceKind;
  candidateType?: CandidateType;
};

type YouTubeSource = {
  type: "youtube";
  author: string;
  platform: "YouTube";
  channelId: string;
  tags: string[];
  priority: number;
};

type GitHubSearchSource = {
  type: "github-search";
  query: string;
  tags: string[];
  priority: number;
};

type ManualSource = {
  type: "manual";
  author: string;
  platform: string;
  url: string;
  sourceKind: SourceKind;
  youtubeVideoId?: string;
  title: string;
  summary: string;
  tags: string[];
  priority: number;
  publishedAt?: string;
  metrics?: Candidate["metrics"];
};

type Source = RssSource | YouTubeSource | GitHubSearchSource | ManualSource;

const aiKeywords = [
  "chatgpt",
  "codex",
  "claude",
  "gemini",
  "openai",
  "seedance",
  "doubao",
  "jimeng",
  "runninghub",
  "libtv",
  "mcp",
  "agent",
  "skill",
  "plugin",
  "workflow",
  "prompt",
  "automation",
  "llm",
  "rag",
  "豆包",
  "即梦",
  "插件",
  "工作流",
  "提示词",
  "自动化",
  "项目",
  "教程",
  "实战"
];

const sources: Source[] = [
  {
    type: "manual",
    author: "松小鼠呀",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=kxBCLl6eexE",
    sourceKind: "video",
    youtubeVideoId: "kxBCLl6eexE",
    title: "Codex 10个必装插件！实战演示：自动生成酷炫动画、视频、网页游戏和手机App，快速上手AI Agent #chatgpt #codex #ai",
    summary: "围绕 Codex 插件和 AI Agent 实战展开，用演示型内容帮助读者理解插件如何把生成动画、视频、网页游戏和 App 的流程串起来。",
    tags: ["Codex", "插件", "AI Agent"],
    priority: 95
  },
  {
    type: "manual",
    author: "木子不写代码",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=hGaKA3cfMjk",
    sourceKind: "video",
    youtubeVideoId: "hGaKA3cfMjk",
    title: "Codex 零基础终极教程：功能、办公、编程、自动化一次讲透！",
    summary: "面向零基础用户系统讲 Codex 的办公、编程和自动化用途，适合作为新用户理解 AI 编程助手与通用自动化工作流的入口。",
    tags: ["Codex", "自动化", "教程"],
    priority: 94
  },
  {
    type: "manual",
    author: "學長Ethan",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=tfeCwDT-5m0",
    sourceKind: "video",
    youtubeVideoId: "tfeCwDT-5m0",
    title: "Codex保姆級完整教學：從入門到進階，自動生成內容、網頁、影片和App，快速學會指揮你的超級AI Agent #chatgpt #codex",
    summary: "从入门到进阶讲 Codex 与 AI Agent 的指挥方式，覆盖内容、网页、影片和 App 自动生成，符合本站对可复用实操教程的筛选标准。",
    tags: ["Codex", "AI Agent", "内容生成"],
    priority: 93
  },
  {
    type: "rss",
    author: "掘金",
    platform: "掘金",
    url: "https://juejin.cn/rss",
    tags: ["掘金", "AI 开发", "实战"],
    priority: 72,
    candidateType: "juejin"
  },
  {
    type: "rss",
    author: "Simon Willison",
    platform: "个人博客",
    url: "https://simonwillison.net/atom/everything/",
    tags: ["LLM", "AI 工具", "英文文章"],
    priority: 68,
    candidateType: "site"
  },
  {
    type: "rss",
    author: "LangChain",
    platform: "官方博客",
    url: "https://blog.langchain.com/rss/",
    tags: ["LangChain", "AI Agent", "英文文章"],
    priority: 66,
    candidateType: "site"
  },
  {
    type: "youtube",
    author: "OpenAI",
    platform: "YouTube",
    channelId: "UCXZCJLdBC09xxGZ6gcdrc6A",
    tags: ["OpenAI", "ChatGPT", "视频"],
    priority: 64
  },
  {
    type: "github-search",
    query: "topic:ai-agent stars:>500",
    tags: ["GitHub", "AI Agent", "开源项目"],
    priority: 62
  },
  {
    type: "github-search",
    query: "mcp server stars:>100",
    tags: ["GitHub", "MCP", "开源项目"],
    priority: 60
  },
  {
    type: "github-search",
    query: "llm workflow automation stars:>300",
    tags: ["GitHub", "LLM", "工作流"],
    priority: 58
  }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  parseTagValue: false
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value && "text" in value) return text((value as { text?: unknown }).text);
  if (typeof value === "object" && value && "_" in value) return text((value as { _?: unknown })._);
  return "";
}

function normalizeDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AI Study Hub content collector (+https://github.com/LZKDreamer/ai-study-hub)"
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AI Study Hub content collector (+https://github.com/LZKDreamer/ai-study-hub)",
      Accept: "application/vnd.github+json"
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

function rssLink(entry: Record<string, unknown>) {
  const link = entry.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const preferred = link.find((item) => typeof item === "object" && item && "href" in item && (item as { rel?: string }).rel !== "self");
    return rssLink({ link: preferred ?? link[0] });
  }
  if (typeof link === "object" && link && "href" in link) return text((link as { href?: unknown }).href);
  return "";
}

function looksLikeLowValueUpdate(candidate: Pick<Candidate, "title" | "url" | "summary">) {
  const value = `${candidate.title} ${candidate.url} ${candidate.summary}`.toLowerCase();

  if (value.includes("github.com/") && value.includes("/releases")) return true;
  if (value.includes("/changelog")) return true;
  if (value.includes("release notes")) return true;
  if (value.includes("released version")) return true;
  if (/\bv?\d+\.\d+\.\d+/.test(candidate.title.toLowerCase())) return true;
  if (/\b(alpha|beta|patch|minor release|maintenance release)\b/.test(value)) return true;

  return false;
}

function getMatchedKeywords(candidate: Pick<Candidate, "title" | "summary" | "tags">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return aiKeywords.filter((keyword) => value.includes(keyword.toLowerCase()));
}

function hasStrongTitleMatch(value: string) {
  const title = value.toLowerCase();
  return (
    /\bai\b/i.test(title) ||
    ["agent", "chatgpt", "codex", "claude", "gemini", "openai", "mcp", "llm", "rag", "豆包", "即梦", "插件", "工作流"].some((keyword) =>
      title.includes(keyword.toLowerCase())
    )
  );
}

function hasReusableSignal(candidate: Pick<Candidate, "title" | "summary">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return /tutorial|guide|demo|walkthrough|workflow|automation|agent|mcp|skill|plugin|project|build|case|教程|指南|实战|案例|工作流|自动化|插件|项目|变现|复用/.test(
    value
  );
}

function hasLearningValue(candidate: Pick<Candidate, "title" | "summary" | "tags" | "sourceKind" | "candidateType">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const matched = getMatchedKeywords(candidate);
  const strongTitleMatch = hasStrongTitleMatch(candidate.title);
  const hasExplicitAi = /\bai\b/i.test(value) || value.includes("人工智能");
  const reusable = hasReusableSignal(candidate);

  if (candidate.sourceKind === "video") return strongTitleMatch || matched.length >= 2 || reusable;
  if (candidate.candidateType === "github") return matched.length >= 1 || reusable;

  if (candidate.candidateType === "site") return strongTitleMatch;
  if (candidate.candidateType === "juejin") return strongTitleMatch;

  return matched.length >= 2 || (hasExplicitAi && matched.length >= 1) || (strongTitleMatch && candidate.summary.length >= 60);
}

function metricNumber(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric)) return 0;
  if (normalized.includes("k")) return numeric * 1000;
  if (normalized.includes("m")) return numeric * 1000000;
  return numeric;
}

function heatScore(metrics: Candidate["metrics"]) {
  const reads = metricNumber(metrics?.reads);
  const views = metricNumber(metrics?.views);
  const likes = metricNumber(metrics?.likes);
  const stars = metricNumber(metrics?.stars);
  const signal = reads * 0.25 + views * 0.2 + likes * 1.2 + stars * 2;
  return signal > 0 ? Math.min(12, Math.log10(signal + 1) * 3) : 0;
}

function freshnessScore(publishedAt: string) {
  const time = new Date(publishedAt).getTime();
  if (!Number.isFinite(time)) return 0;

  const ageDays = Math.max(0, (Date.now() - time) / 86400000);
  if (ageDays <= 7) return 10;
  if (ageDays <= 30) return 7;
  if (ageDays <= 180) return 4;
  return 1;
}

function sourceCredibilityScore(candidate: Pick<Candidate, "candidateType" | "platform" | "author">) {
  if (candidate.candidateType === "github") return 8;
  if (candidate.platform === "YouTube") return 6;
  if (candidate.platform === "官方博客") return 7;
  if (candidate.author === "Simon Willison") return 7;
  if (candidate.platform === "掘金") return 5;
  return 4;
}

function candidateQualityScore(candidate: Candidate) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const matched = getMatchedKeywords(candidate);
  const reusable = hasReusableSignal(candidate);
  const hasProjectSignal = /github|repo|project|workflow|case|demo|build|开源|项目|案例|工作流|实战|变现/.test(value);
  const hasSpecificTitle = candidate.title.length >= 12 && !/[!?！？]{2,}|震惊|爆款|速看/.test(candidate.title);
  const topicScore = Math.min(30, matched.length * 5 + (hasStrongTitleMatch(candidate.title) ? 8 : 0));
  const learningScore = reusable ? 22 : candidate.summary.length >= 80 ? 12 : 4;
  const projectScore = hasProjectSignal ? 16 : 0;
  const specificityScore = hasSpecificTitle ? 8 : 2;

  return (
    candidate.priority * 0.3 +
    topicScore +
    learningScore +
    projectScore +
    specificityScore +
    heatScore(candidate.metrics) +
    freshnessScore(candidate.publishedAt) +
    sourceCredibilityScore(candidate)
  );
}

function manualCandidate(source: ManualSource): Candidate {
  return {
    id: `${slugPart(source.platform)}-${slugPart(source.title)}`,
    author: source.author,
    platform: source.platform,
    sourceUrl: source.url,
    title: source.title,
    url: source.url,
    sourceKind: source.sourceKind,
    youtubeVideoId: source.youtubeVideoId,
    publishedAt: normalizeDate(source.publishedAt),
    summary: source.summary,
    tags: source.tags,
    candidateType: "manual",
    priority: source.priority,
    metrics: source.metrics
  };
}

async function collectRss(source: RssSource): Promise<Candidate[]> {
  const raw = await fetchText(source.url);
  const parsed = parser.parse(raw) as {
    rss?: { channel?: { item?: Record<string, unknown>[] | Record<string, unknown> } };
    feed?: { entry?: Record<string, unknown>[] | Record<string, unknown> };
  };
  const rssItems = asArray(parsed.rss?.channel?.item);
  const atomItems = asArray(parsed.feed?.entry);
  const entries = rssItems.length > 0 ? rssItems : atomItems;

  return entries.slice(0, 15).map((entry, index) => {
    const title = text(entry.title).trim();
    const url = rssLink(entry) || source.url;
    const summary = stripHtml(text(entry.description) || text(entry.summary) || text(entry.content) || text((entry as { encoded?: unknown }).encoded));
    const publishedAt = normalizeDate(text(entry.pubDate) || text(entry.published) || text(entry.updated));

    return {
      id: `${slugPart(source.platform)}-${slugPart(title || url)}-${index}`,
      author: source.author,
      platform: source.platform,
      sourceUrl: source.url,
      title: title || url,
      url,
      sourceKind: source.sourceKind ?? "article",
      publishedAt,
      summary,
      tags: source.tags,
      candidateType: source.candidateType ?? "site",
      priority: source.priority - index
    };
  });
}

async function collectYouTube(source: YouTubeSource): Promise<Candidate[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
  const raw = await fetchText(feedUrl);
  const parsed = parser.parse(raw) as { feed?: { entry?: Record<string, unknown>[] | Record<string, unknown> } };

  return asArray(parsed.feed?.entry)
    .slice(0, 8)
    .map((entry, index) => {
      const title = text(entry.title).trim();
      const videoId = text((entry as { "yt:videoId"?: unknown })["yt:videoId"]);
      const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : rssLink(entry) || feedUrl;
      const media = (entry as { "media:group"?: Record<string, unknown> })["media:group"];
      const description = media ? text(media["media:description"]) : "";
      const publishedAt = normalizeDate(text(entry.published) || text(entry.updated));

      return {
        id: `${slugPart(source.author)}-${slugPart(title || videoId || url)}-${index}`,
        author: source.author,
        platform: source.platform,
        sourceUrl: feedUrl,
        title: title || url,
        url,
        sourceKind: "video",
        youtubeVideoId: videoId || undefined,
        publishedAt,
        summary: stripHtml(description),
        tags: source.tags,
        candidateType: "youtube",
        priority: source.priority - index
      };
    });
}

type GitHubRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  pushed_at: string;
  owner: { login: string };
};

async function collectGitHub(source: GitHubSearchSource): Promise<Candidate[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(source.query)}&sort=stars&order=desc&per_page=10`;
  const data = await fetchJson<{ items?: GitHubRepo[] }>(url);

  return (data.items ?? []).map((repo, index) => {
    const description = repo.description?.trim() || `${repo.full_name} is an AI-related open source project.`;
    const languageTag = repo.language ? [repo.language] : [];

    return {
      id: `github-${slugPart(repo.full_name)}`,
      author: repo.owner.login,
      platform: "GitHub",
      sourceUrl: repo.html_url,
      title: repo.full_name,
      url: repo.html_url,
      sourceKind: "link",
      publishedAt: normalizeDate(repo.pushed_at || repo.updated_at),
      summary: description,
      tags: [...source.tags, ...languageTag].slice(0, 6),
      candidateType: "github",
      priority: source.priority - index,
      metrics: repo.stargazers_count > 0 ? { stars: String(repo.stargazers_count) } : undefined
    };
  });
}

function dedupe(candidates: Candidate[]) {
  const seen = new Set<string>();
  const result: Candidate[] = [];

  for (const candidate of candidates) {
    const key = candidate.youtubeVideoId ? `youtube:${candidate.youtubeVideoId}` : (candidate.url || candidate.title).toLowerCase().replace(/[?#].*$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }

  return result;
}

export async function collectCandidates() {
  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      try {
        if (source.type === "manual") return [manualCandidate(source)];
        if (source.type === "youtube") return await collectYouTube(source);
        if (source.type === "github-search") return await collectGitHub(source);
        return await collectRss(source);
      } catch (error) {
        const name = source.type === "github-search" ? `GitHub ${source.query}` : source.platform;
        throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  const failures = settled
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason));

  const candidates = dedupe(
    settled
      .filter((result): result is PromiseFulfilledResult<Candidate[]> => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .filter((candidate) => candidate.title && candidate.url)
      .filter((candidate) => !looksLikeLowValueUpdate(candidate))
      .filter((candidate) => hasLearningValue(candidate))
  )
    .sort((a, b) => {
      const quality = candidateQualityScore(b) - candidateQualityScore(a);
      if (quality !== 0) return quality;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 60);

  return { candidates, failures };
}

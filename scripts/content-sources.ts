import { XMLParser } from "fast-xml-parser";
import type { Candidate } from "./content-types";

type RssSource = {
  type: "rss";
  name: string;
  url: string;
  tags: string[];
  priority: number;
};

type GitHubReleaseSource = {
  type: "github-release";
  name: string;
  owner: string;
  repo: string;
  tags: string[];
  priority: number;
};

type Source = RssSource | GitHubReleaseSource;

const sources: Source[] = [
  {
    type: "github-release",
    name: "OpenAI Codex Releases",
    owner: "openai",
    repo: "codex",
    tags: ["Codex", "AI 编程", "GitHub"],
    priority: 100
  },
  {
    type: "github-release",
    name: "Next.js Releases",
    owner: "vercel",
    repo: "next.js",
    tags: ["Next.js", "Vercel", "前端"],
    priority: 70
  },
  {
    type: "github-release",
    name: "MCP TypeScript SDK Releases",
    owner: "modelcontextprotocol",
    repo: "typescript-sdk",
    tags: ["MCP", "AI Agent", "SDK"],
    priority: 88
  },
  {
    type: "github-release",
    name: "LangChain.js Releases",
    owner: "langchain-ai",
    repo: "langchainjs",
    tags: ["AI Agent", "LangChain", "工具调用"],
    priority: 72
  },
  {
    type: "rss",
    name: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    tags: ["OpenAI", "ChatGPT", "AI最新资讯"],
    priority: 96
  },
  {
    type: "rss",
    name: "Vercel Blog",
    url: "https://vercel.com/blog/rss.xml",
    tags: ["Vercel", "前端", "部署"],
    priority: 66
  },
  {
    type: "rss",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    tags: ["Hugging Face", "模型", "Demo"],
    priority: 68
  },
  {
    type: "rss",
    name: "LangChain Blog",
    url: "https://blog.langchain.com/rss/",
    tags: ["LangChain", "AI Agent", "工作流"],
    priority: 76
  },
  {
    type: "rss",
    name: "Product Hunt",
    url: "https://www.producthunt.com/feed",
    tags: ["Product Hunt", "AI 工具", "新品"],
    priority: 58
  },
  {
    type: "rss",
    name: "Hacker News AI",
    url: "https://hnrss.org/newest?q=AI",
    tags: ["Hacker News", "AI最新资讯", "社区"],
    priority: 54
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
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
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

function rssLink(entry: Record<string, unknown>) {
  const link = entry.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const first = link.find((item) => typeof item === "object" && item && "href" in item) ?? link[0];
    return rssLink({ link: first });
  }
  if (typeof link === "object" && link && "href" in link) return text((link as { href?: unknown }).href);
  return "";
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

  return entries.slice(0, 8).map((entry, index) => {
    const title = text(entry.title).trim();
    const url = rssLink(entry) || source.url;
    const summary = stripHtml(text(entry.description) || text(entry.summary) || text(entry.content));
    const publishedAt = normalizeDate(text(entry.pubDate) || text(entry.published) || text(entry.updated));

    return {
      id: `${slugPart(source.name)}-${slugPart(title || url)}-${index}`,
      source: source.name,
      sourceUrl: source.url,
      title: title || url,
      url,
      publishedAt,
      summary,
      tags: source.tags,
      candidateType: "rss",
      priority: source.priority - index
    };
  });
}

async function collectGitHubRelease(source: GitHubReleaseSource): Promise<Candidate[]> {
  const feedUrl = `https://github.com/${source.owner}/${source.repo}/releases.atom`;
  const raw = await fetchText(feedUrl);
  const parsed = parser.parse(raw) as { feed?: { entry?: Record<string, unknown>[] | Record<string, unknown> } };

  return asArray(parsed.feed?.entry)
    .slice(0, 5)
    .map((entry, index) => {
      const title = text(entry.title).trim();
      const url = rssLink(entry) || `https://github.com/${source.owner}/${source.repo}/releases`;
      const summary = stripHtml(text(entry.content) || text(entry.summary));
      const publishedAt = normalizeDate(text(entry.updated) || text(entry.published));

      return {
        id: `${source.owner}-${source.repo}-${slugPart(title || url)}-${index}`,
        source: source.name,
        sourceUrl: `https://github.com/${source.owner}/${source.repo}`,
        title: title || `${source.owner}/${source.repo} release`,
        url,
        publishedAt,
        summary,
        tags: source.tags,
        candidateType: "github-release",
        priority: source.priority - index
      };
    });
}

function dedupe(candidates: Candidate[]) {
  const seen = new Set<string>();
  const result: Candidate[] = [];

  for (const candidate of candidates) {
    const key = (candidate.url || candidate.title).toLowerCase().replace(/[?#].*$/, "");
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
        if (source.type === "rss") return await collectRss(source);
        return await collectGitHubRelease(source);
      } catch (error) {
        throw new Error(`${source.name}: ${error instanceof Error ? error.message : String(error)}`);
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
  )
    .sort((a, b) => {
      const priority = b.priority - a.priority;
      if (priority !== 0) return priority;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 60);

  return { candidates, failures };
}

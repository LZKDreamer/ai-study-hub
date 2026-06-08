import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Candidate } from "./content-types";

const execFileAsync = promisify(execFile);

type YouTubeThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type YouTubeThumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: YouTubeThumbnails;
    channelTitle?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

type YouTubeChannelItem = {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: YouTubeThumbnails;
  };
};

type YouTubeChannelsResponse = {
  items?: YouTubeChannelItem[];
};

const youtubeSearchQueries = [
  "AI 教程",
  "AI 工具 使用",
  "ChatGPT 工作流",
  "Codex 使用",
  "Codex Skill",
  "Codex 插件",
  "AI Agent 教程",
  "MCP 教程",
  "Claude Code",
  "Gemini AI 教程",
  "AI 自动化",
  "AI 变现"
];

const aiKeywords = [
  "ai",
  "chatgpt",
  "codex",
  "claude",
  "gemini",
  "openai",
  "mcp",
  "agent",
  "skill",
  "plugin",
  "workflow",
  "automation",
  "prompt",
  "llm",
  "rag",
  "教程",
  "实战",
  "项目",
  "案例",
  "工作流",
  "插件",
  "自动化",
  "提示词",
  "变现",
  "智能体",
  "使用",
  "演示"
];

const searchMaxResults = 25;
const recentWindowDays = 180;
const excludedVideoIds = new Set(["kxBCLl6eexE", "hGaKA3cfMjk", "tfeCwDT-5m0"]);
const excludedSourceUrls = new Set(Array.from(excludedVideoIds, (id) => `https://www.youtube.com/watch?v=${id}`));

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
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function youtubePublishedAfter() {
  return new Date(Date.now() - recentWindowDays * 86400000).toISOString();
}

function bestThumbnail(thumbnails: YouTubeThumbnails | undefined) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url
  );
}

function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeApiUrl(pathname: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${pathname}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function fetchYouTubeJson<T>(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AI Study Hub content collector (+https://github.com/LZKDreamer/ai-study-hub)"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const safeUrl = new URL(url);
      safeUrl.searchParams.delete("key");
      const body = await response.text().catch(() => "");
      throw new Error(`${safeUrl.pathname} returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ""}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (process.platform !== "win32") throw error;
    return await fetchYouTubeJsonWithPowerShell<T>(url, error);
  }
}

async function fetchYouTubeJsonWithPowerShell<T>(url: string, originalError: unknown) {
  const outputPath = path.join(os.tmpdir(), `ai-study-hub-youtube-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);

  try {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "$ProgressPreference='SilentlyContinue'; $headers=@{Accept='application/json'; 'Accept-Encoding'='identity'; 'User-Agent'='AI Study Hub content collector'}; $json=Invoke-RestMethod -Uri $env:AI_STUDY_HUB_FETCH_URL -Headers $headers | ConvertTo-Json -Depth 100 -Compress; [System.IO.File]::WriteAllText($env:AI_STUDY_HUB_FETCH_OUTPUT, $json, [System.Text.UTF8Encoding]::new($false))"
      ],
      {
        env: {
          ...process.env,
          AI_STUDY_HUB_FETCH_URL: url,
          AI_STUDY_HUB_FETCH_OUTPUT: outputPath
        },
        maxBuffer: 5 * 1024 * 1024,
        timeout: 20000,
        windowsHide: true
      }
    );

    const content = (await readFile(outputPath, "utf8")).trim();
    if (!content) throw new Error("empty response body");
    return JSON.parse(content) as T;
  } catch (fallbackError) {
    const safeUrl = new URL(url);
    safeUrl.searchParams.delete("key");
    const originalMessage = originalError instanceof Error ? originalError.message : String(originalError);
    const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
    throw new Error(`${safeUrl.pathname} fetch failed. Node fetch: ${originalMessage}. PowerShell fallback: ${fallbackMessage}`);
  } finally {
    await rm(outputPath, { force: true }).catch(() => undefined);
  }
}

async function fetchYouTubeChannels(apiKey: string, channelIds: string[]) {
  const channels = new Map<string, { title: string; avatarUrl?: string }>();
  const uniqueIds = Array.from(new Set(channelIds.filter(Boolean)));

  for (let index = 0; index < uniqueIds.length; index += 50) {
    const ids = uniqueIds.slice(index, index + 50);
    const url = youtubeApiUrl("channels", {
      part: "snippet",
      id: ids.join(","),
      key: apiKey
    });
    const data = await fetchYouTubeJson<YouTubeChannelsResponse>(url);

    for (const item of data.items ?? []) {
      if (!item.id) continue;
      channels.set(item.id, {
        title: stripHtml(item.snippet?.title ?? "") || item.id,
        avatarUrl: bestThumbnail(item.snippet?.thumbnails)
      });
    }
  }

  return channels;
}

async function collectYouTubeSearch(apiKey: string): Promise<Candidate[]> {
  const publishedAfter = youtubePublishedAfter();
  const groupedItems = await Promise.all(
    youtubeSearchQueries.map(async (query, queryIndex) => {
      console.error(`[collect] YouTube search ${queryIndex + 1}/${youtubeSearchQueries.length}: ${query}`);
    const url = youtubeApiUrl("search", {
      part: "snippet",
      type: "video",
      maxResults: searchMaxResults,
      q: query,
      relevanceLanguage: "zh-Hans",
      safeSearch: "none",
      publishedAfter,
      key: apiKey
    });
    const data = await fetchYouTubeJson<YouTubeSearchResponse>(url);
      return { queryIndex, items: data.items ?? [] };
    })
  );

  console.error("[collect] Fetching YouTube channel metadata");
  const channelMap = await fetchYouTubeChannels(
    apiKey,
    groupedItems.flatMap((group) => group.items.map((item) => item.snippet?.channelId ?? ""))
  );

  return groupedItems.flatMap((group) =>
    group.items.flatMap((item, resultIndex): Candidate[] => {
      const videoId = item.id?.videoId?.trim();
      const snippet = item.snippet;
      if (!videoId || !snippet) return [];

      const channelId = snippet.channelId?.trim();
      const channel = channelId ? channelMap.get(channelId) : undefined;
      const title = stripHtml(snippet.title ?? "");
      const url = youtubeWatchUrl(videoId);

      return [
        {
          id: `youtube-${videoId}`,
          author: channel?.title || stripHtml(snippet.channelTitle ?? "") || "YouTube",
          platform: "YouTube",
          sourceUrl: url,
          title,
          originalTitle: title,
          url,
          sourceKind: "video",
          youtubeVideoId: videoId,
          channelId,
          channelAvatarUrl: channel?.avatarUrl,
          imageUrl: bestThumbnail(snippet.thumbnails),
          publishedAt: normalizeDate(snippet.publishedAt),
          summary: stripHtml(snippet.description ?? ""),
          tags: ["YouTube", "AI 学习"],
          candidateType: "youtube",
          priority: 100 - group.queryIndex * 2 - resultIndex * 0.4
        }
      ];
    })
  );
}

function looksLikeLowValueUpdate(candidate: Pick<Candidate, "title" | "url" | "summary">) {
  const value = `${candidate.title} ${candidate.url} ${candidate.summary}`.toLowerCase();

  if (value.includes("/releases")) return true;
  if (value.includes("/changelog")) return true;
  if (value.includes("release notes")) return true;
  if (value.includes("released version")) return true;
  if (/\bv?\d+\.\d+\.\d+/.test(candidate.title.toLowerCase())) return true;
  if (/\b(alpha|beta|patch|minor release|maintenance release)\b/.test(value)) return true;

  return false;
}

function isExcludedCandidate(candidate: Pick<Candidate, "url" | "sourceUrl" | "youtubeVideoId">) {
  const normalizedUrl = (candidate.url || candidate.sourceUrl).replace(/[?#].*$/, "");
  return Boolean(
    (candidate.youtubeVideoId && excludedVideoIds.has(candidate.youtubeVideoId)) ||
      excludedSourceUrls.has(normalizedUrl)
  );
}

function getMatchedKeywords(candidate: Pick<Candidate, "title" | "summary" | "tags">) {
  const value = `${candidate.title} ${candidate.summary} ${candidate.tags.join(" ")}`.toLowerCase();
  return aiKeywords.filter((keyword) => value.includes(keyword.toLowerCase()));
}

function hasStrongTitleMatch(value: string) {
  const title = value.toLowerCase();
  return aiKeywords.some((keyword) => title.includes(keyword.toLowerCase()));
}

function hasReusableSignal(candidate: Pick<Candidate, "title" | "summary">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return /tutorial|guide|demo|walkthrough|workflow|automation|agent|mcp|skill|plugin|project|build|case|prompt|use|how to|教程|指南|实战|案例|工作流|自动化|插件|项目|变现|复用|使用|演示|搭建|部署|完整流程|从零开始/.test(
    value
  );
}

function hasUsefulTutorialSignal(candidate: Pick<Candidate, "title" | "summary">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return /tutorial|guide|demo|walkthrough|course|lesson|build|workflow|project|case|how to|教程|指南|实战|案例|工作流|项目|使用|演示|搭建|部署|复盘|从零开始/.test(
    value
  );
}

function hasExcludedLowLearningSignal(candidate: Pick<Candidate, "title" | "summary">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  if (hasUsefulTutorialSignal(candidate)) return false;

  return (
    /\b(news|breaking|rumor|leak|reaction|trailer|teaser|shorts|clip|podcast|interview|livestream|live stream|replay|highlights)\b/.test(
      value
    ) || /新闻|资讯|快讯|爆料|泄露|反应|预告|花絮|娱乐|直播|回放|录播|切片|访谈|播客|合集|速看|震惊|爆款|必看/.test(value)
  );
}

function hasLearningValue(candidate: Pick<Candidate, "title" | "summary" | "tags" | "sourceKind" | "candidateType">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const matched = getMatchedKeywords(candidate);
  const strongTitleMatch = hasStrongTitleMatch(candidate.title);
  const hasExplicitAi = /\bai\b/i.test(value) || value.includes("人工智能");
  const reusable = hasReusableSignal(candidate);

  if (hasExcludedLowLearningSignal(candidate)) return false;
  if (candidate.sourceKind === "video") return (strongTitleMatch || matched.length >= 2 || hasExplicitAi) && reusable;

  return matched.length >= 2 || (hasExplicitAi && matched.length >= 1) || (strongTitleMatch && candidate.summary.length >= 60);
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

function candidateQualityScore(candidate: Candidate) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const matched = getMatchedKeywords(candidate);
  const reusable = hasReusableSignal(candidate);
  const hasProjectSignal = /github|repo|project|workflow|case|demo|build|项目|案例|工作流|实战|变现|搭建|部署/.test(value);
  const hasSpecificTitle = candidate.title.length >= 12 && !/[!?！？]{2,}|震惊|爆款|速看/.test(candidate.title);
  const topicScore = Math.min(30, matched.length * 5 + (hasStrongTitleMatch(candidate.title) ? 8 : 0));
  const learningScore = reusable ? 22 : candidate.summary.length >= 80 ? 12 : 4;
  const projectScore = hasProjectSignal ? 16 : 0;
  const specificityScore = hasSpecificTitle ? 8 : 2;

  return candidate.priority * 0.3 + topicScore + learningScore + projectScore + specificityScore + freshnessScore(candidate.publishedAt);
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
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return {
      candidates: [],
      failures: ["YOUTUBE_API_KEY not set; kept checked-in data."]
    };
  }

  try {
    const candidates = dedupe(await collectYouTubeSearch(apiKey))
      .filter((candidate) => candidate.title && candidate.url)
      .filter((candidate) => !isExcludedCandidate(candidate))
      .filter((candidate) => !looksLikeLowValueUpdate(candidate))
      .filter((candidate) => hasLearningValue(candidate))
      .sort((a, b) => {
        const quality = candidateQualityScore(b) - candidateQualityScore(a);
        if (quality !== 0) return quality;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 60);

    return { candidates, failures: [] };
  } catch (error) {
    return {
      candidates: [],
      failures: [`YouTube API: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

import type { Candidate, ContentItem, LatestData, SourceKind } from "./content-types";
import { type DailyCallLimit, generateText } from "./ai-provider";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function compactCandidate(candidate: Candidate, index: number) {
  return {
    index,
    author: candidate.author,
    platform: candidate.platform,
    url: candidate.url,
    sourceKind: candidate.sourceKind,
    youtubeVideoId: candidate.youtubeVideoId,
    channelId: candidate.channelId,
    channelAvatarUrl: candidate.channelAvatarUrl,
    imageUrl: candidate.imageUrl,
    title: candidate.title,
    originalTitle: candidate.originalTitle,
    publishedAt: candidate.publishedAt,
    summary: candidate.summary.slice(0, 520),
    tags: candidate.tags,
    priority: candidate.priority
  };
}

function extractJson(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? value;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI response did not contain a JSON object.");
  return raw.slice(start, end + 1);
}

function normalizeSourceKind(value: string | undefined, candidate: Candidate): SourceKind {
  if (value === "video" || candidate.sourceKind === "video") return "video";
  if (value === "link" || candidate.sourceKind === "link") return "link";
  return "article";
}

function normalizeTags(value: string[] | undefined, candidate: Candidate) {
  const tags = [...(value ?? []), ...candidate.tags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => !/^youtube$/i.test(tag));

  return Array.from(new Set(tags)).slice(0, 6);
}

function normalizeGeneratedItem(item: Partial<ContentItem>, candidate: Candidate, index: number): ContentItem {
  const title = candidate.originalTitle?.trim() || candidate.title;
  const sourceKind = normalizeSourceKind(item.sourceKind, candidate);
  const tags = normalizeTags(item.tags, candidate);
  const fallbackSummary =
    candidate.summary ||
    `${title} 值得加入学习列表，因为它围绕 AI 工具、项目实践或工作流展开，适合回到原视频学习具体方法。`;

  return {
    id: item.id?.trim() || `youtube-${candidate.youtubeVideoId ?? slugify(title)}`,
    slug: item.slug?.trim() || slugify(`${candidate.youtubeVideoId ?? ""}-${title}`),
    author: candidate.author,
    platform: candidate.platform,
    sourceUrl: candidate.url,
    sourceKind,
    youtubeVideoId: candidate.youtubeVideoId,
    channelId: candidate.channelId,
    channelAvatarUrl: candidate.channelAvatarUrl,
    originalTitle: candidate.originalTitle || title,
    imageUrl: candidate.imageUrl,
    publishedAt: candidate.publishedAt,
    title,
    summary: item.summary?.trim() || fallbackSummary.slice(0, 180),
    tags: tags.length >= 2 ? tags : [...tags, "AI 学习", "视频教程"].slice(0, 6),
    featured: index === 0
  };
}

function itemDedupeKeys(item: ContentItem) {
  return [item.youtubeVideoId ? `youtube:${item.youtubeVideoId}` : null, `url:${item.sourceUrl}`, `slug:${item.slug}`].filter(
    (key): key is string => Boolean(key)
  );
}

function dedupeAndBackfillItems(items: ContentItem[], selected: Candidate[]) {
  const seen = new Set<string>();
  const result: ContentItem[] = [];

  function addItem(item: ContentItem) {
    const keys = itemDedupeKeys(item);
    if (keys.some((key) => seen.has(key))) return false;

    keys.forEach((key) => seen.add(key));
    result.push({
      ...item,
      featured: false
    });
    return true;
  }

  items.forEach(addItem);

  for (const candidate of selected) {
    if (result.length >= 20) break;
    addItem(normalizeGeneratedItem({}, candidate, result.length));
  }

  return result.slice(0, 20).map((item, index) => ({
    ...item,
    featured: index === 0
  }));
}

export async function generateLatestFromCandidates(candidates: Candidate[], date: string, limit: DailyCallLimit): Promise<LatestData> {
  const selected = candidates.slice(0, 60);
  const prompt = `You are generating today's 20 AI Study Hub YouTube learning recommendations.
Return JSON only, with this top-level shape: {"items":[...]}.

Hard requirements:
1. Output exactly 20 items.
2. Each item must include candidateIndex, summary, and tags.
3. Do not translate or rewrite YouTube titles.
4. Do not invent video facts beyond candidate metadata.
5. The recommendation summary must be Chinese, 80-160 Chinese characters.
6. Tags must be 2-6 short Chinese tags and should mention concrete tools or topics when present.
7. Do not output metrics, views, likes, reads, or stars.
8. Prefer videos about Codex, Codex Skills, MCP, AI Agents, AI workflows, AI tools, automation, tutorials, demos, projects, and monetization.
9. Filter out pure news, empty opinions, clickbait, generic hype, entertainment, and version-only updates.

Candidates:
${JSON.stringify(selected.map(compactCandidate), null, 2)}`;

  const content = await generateText(
    {
      messages: [
        {
          role: "system",
          content:
            "You are a careful Chinese AI learning content editor. Only generate summaries and tags from candidate metadata. Preserve all source metadata."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    },
    limit
  );

  const parsed = JSON.parse(extractJson(content)) as { items?: Array<Partial<ContentItem> & { candidateIndex?: number }> };
  const rawItems = parsed.items ?? [];
  const normalizedItems = rawItems.map((item, index) => {
    const candidate = selected[item.candidateIndex ?? index] ?? selected[index] ?? selected[0];
    return normalizeGeneratedItem(item, candidate, index);
  });

  return {
    date,
    updatedCount: 20,
    items: dedupeAndBackfillItems(normalizedItems, selected)
  };
}

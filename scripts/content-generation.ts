import type { Candidate, ContentItem, ContentMetrics, LatestData, SourceKind } from "./content-types";
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
    imageUrl: candidate.imageUrl,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
    summary: candidate.summary.slice(0, 520),
    tags: candidate.tags,
    metrics: candidate.metrics,
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

function visibleMetric(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized || normalized === "0") return undefined;
  if (/待获取|unknown|n\/a/i.test(normalized)) return undefined;
  return normalized;
}

function cleanMetrics(metrics: ContentMetrics | undefined): ContentMetrics | undefined {
  if (!metrics) return undefined;
  const cleaned = {
    reads: visibleMetric(metrics.reads),
    views: visibleMetric(metrics.views),
    likes: visibleMetric(metrics.likes),
    stars: visibleMetric(metrics.stars)
  };

  return Object.values(cleaned).some(Boolean) ? cleaned : undefined;
}

function normalizeGeneratedItem(item: Partial<ContentItem>, candidate: Candidate, index: number): ContentItem {
  const title = item.title?.trim() || candidate.title;
  const sourceKind = normalizeSourceKind(item.sourceKind, candidate);
  const tags = Array.from(new Set([...(item.tags ?? []), ...candidate.tags])).filter(Boolean).slice(0, 6);
  const fallbackSummary = candidate.summary || `${title} 值得推荐，因为它围绕 AI 工具、项目实践或工作流展开，读者可以直接回到原文学习具体方法。`;

  return {
    id: item.id?.trim() || `item-${slugify(title)}`,
    slug: item.slug?.trim() || slugify(title),
    author: item.author?.trim() || candidate.author,
    platform: item.platform?.trim() || candidate.platform,
    sourceUrl: item.sourceUrl?.trim() || candidate.url,
    sourceKind,
    youtubeVideoId: item.youtubeVideoId?.trim() || candidate.youtubeVideoId,
    imageUrl: item.imageUrl?.trim() || candidate.imageUrl,
    publishedAt: item.publishedAt?.trim() || candidate.publishedAt,
    title,
    summary: item.summary?.trim() || fallbackSummary.slice(0, 180),
    tags,
    metrics: cleanMetrics(item.metrics ?? candidate.metrics),
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
  const prompt = `你要为 AI Study Hub 生成今日 20 条 AI 学习内容推荐。站点可以收中文和英文内容，最终展示语言必须是中文。

硬性要求：
1. 只输出 JSON，不要 Markdown。
2. JSON 顶层格式：{"items":[...]}。
3. 必须正好 20 条。
4. 不要生成二级页正文，不要替代原文；只生成卡片标题、推荐理由和标签。
5. 如果候选标题是中文，title 使用原始标题；如果候选标题是英文，title 翻译或改写成自然中文，但保留项目名、产品名、工具名。
6. GitHub 项目可以进入推荐流：根据 repo 名称、description、stars、语言、更新时间生成中文标题和推荐理由；不要把 GitHub release/changelog 当内容。
7. summary 写“为什么推荐这篇文章/视频/项目”，80-160 字中文，说明内容或项目大概是什么、读者能学到什么、适合怎样复用。
8. tags 生成 2-6 个短标签，优先包含具体工具或主题，如 ChatGPT、Codex、Claude、Gemini、OpenAI、豆包、即梦、RunningHub、libtv、MCP、Agent、Skill、插件、AI 工作流、GitHub 开源。
9. 只保留真实候选里有的 imageUrl；不要编造图片。
10. 如果阅读量、观看量、点赞数或 stars 不存在、未知或为 0，不要输出对应 metrics 字段。
11. 视频必须 sourceKind 为 "video" 且保留 youtubeVideoId。
12. 不得重复 candidateIndex、sourceUrl 或 youtubeVideoId。
13. 每条必须有 id, slug, author, platform, sourceUrl, sourceKind, publishedAt, title, summary, tags。

推荐算法：
- 先过滤主题：AI 工具使用、项目实践、开源项目、AI 赚钱/副业、工作流、Skill/插件、MCP、Agent、国产 AI 工具实践。
- 再按质量评分：是否讲清具体工具用法、是否有真实项目或流程、是否可复用、标题是否可信、内容是否具体、公开热度信号、时效性与来源可信度。
- 过滤纯资讯搬运、空泛观点、标题党、只有版本号或功能清单的更新。
- 公众号不能在网页端稳定自动搜索；只处理已经公开可访问、能拿到元数据的公众号链接或外部公开索引。

候选内容：
${JSON.stringify(selected.map(compactCandidate), null, 2)}`;

  const content = await generateText(
    {
      messages: [
        {
          role: "system",
          content: "你是严谨的中文 AI 内容推荐编辑。你只能基于候选信息生成推荐卡片 JSON，不编造候选中没有的事实。"
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

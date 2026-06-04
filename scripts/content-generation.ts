import type { Candidate, ContentItem, ContentType, LatestData, VisualKind } from "./content-types";
import { type DailyCallLimit, generateText } from "./ai-provider";

const sectionHeadings = [
  "01. 这个内容在讲什么？",
  "02. 它为什么值得关注？",
  "03. 具体怎么做？",
  "04. 用到的工具分别负责什么？",
  "05. 我可以怎么复用？",
  "06. 值不值得关注？"
];

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
    source: candidate.source,
    url: candidate.url,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
    summary: candidate.summary.slice(0, 500),
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

function visualKindFromTags(tags: string[]): VisualKind {
  const joined = tags.join(" ").toLowerCase();
  if (joined.includes("codex") || joined.includes("github") || joined.includes("vercel")) return "codex";
  if (joined.includes("image") || joined.includes("hugging") || joined.includes("模型")) return "image";
  if (joined.includes("skill") || joined.includes("plugin") || joined.includes("插件")) return "skill";
  if (joined.includes("agent") || joined.includes("mcp") || joined.includes("langchain")) return "agent";
  return "research";
}

function normalizeType(value: string | undefined, index: number): ContentType {
  if (index < 4) return "AI最新资讯";
  if (value === "实战案例" || value === "工具教程" || value === "工作流" || value === "Skill/插件") return value;
  const cycle: ContentType[] = ["实战案例", "工具教程", "工作流", "Skill/插件"];
  return cycle[(index - 4) % cycle.length];
}

function normalizeGeneratedItem(item: Partial<ContentItem>, candidate: Candidate, index: number): ContentItem {
  const type = normalizeType(item.type, index);
  const tags = Array.from(new Set([...(item.tags ?? []), ...candidate.tags])).slice(0, 5);
  const title = item.title?.trim() || candidate.title;
  const attentionLabel = type === "AI最新资讯" ? "为什么值得关注" : "解决什么问题";
  const fallbackParagraph = candidate.summary || `${candidate.title} 来自 ${candidate.source}，需要结合原文继续判断实际学习价值。`;

  return {
    id: item.id?.trim() || `${type === "AI最新资讯" ? "news" : "item"}-${slugify(title)}`,
    slug: item.slug?.trim() || slugify(title),
    type,
    category: type,
    source: item.source?.trim() || candidate.source,
    sourceUrl: item.sourceUrl?.trim() || candidate.url,
    publishedAt: item.publishedAt?.trim() || candidate.publishedAt,
    relativeTime: item.relativeTime?.trim() || "今日更新",
    title,
    summary: item.summary?.trim() || fallbackParagraph.slice(0, 200),
    tags,
    attentionLabel,
    attention: item.attention?.trim() || (type === "AI最新资讯" ? "它可能影响 AI 工具的实际使用方式，适合继续跟进。" : "它提供了一个可复用的 AI 工具实践方向，适合拆解成工作流。"),
    audience: item.audience?.trim() || "AI 工具学习者、开发者和内容创作者。",
    visualKind: item.visualKind ?? visualKindFromTags(tags),
    featured: index === 0,
    article: {
      quote: item.article?.quote?.trim() || "这条内容的重点，是把信息转成可复用的 AI 工具学习经验。",
      originalContent: item.article?.originalContent?.length ? item.article.originalContent : [fallbackParagraph],
      sections: sectionHeadings.map((heading, sectionIndex) => ({
        heading: item.article?.sections?.[sectionIndex]?.heading || heading,
        paragraphs: item.article?.sections?.[sectionIndex]?.paragraphs?.length
          ? item.article.sections[sectionIndex].paragraphs
          : ["原文信息有限，当前只能提炼学习方向；具体执行步骤需要结合原文和工具文档继续验证。"]
      })),
      tools: item.article?.tools?.length ? item.article.tools : tags.slice(0, 2).map((tag) => ({ name: tag, role: "提供本条内容涉及的工具或主题能力。" }))
    }
  };
}

export async function generateLatestFromCandidates(candidates: Candidate[], date: string, limit: DailyCallLimit): Promise<LatestData> {
  const selected = candidates.slice(0, 40);
  const prompt = `你要为 AI Study Hub 生成今日 20 条中文内容。AI Study Hub 不是普通新闻站，而是 AI 工具学习与实战案例站。

硬性要求：
1. 只输出 JSON，不要 Markdown。
2. JSON 顶层格式：{"items":[...]}。
3. 必须正好 20 条。
4. 前 3-5 条 type 必须是 "AI最新资讯"；后面 15-17 条必须是 "实战案例"、"工具教程"、"工作流"、"Skill/插件"。
5. AI最新资讯 attentionLabel 必须是 "为什么值得关注"；其他类型必须是 "解决什么问题"。
6. 首页 summary 为 120-200 字中文；不能大段复制英文原文。
7. 详情 article 使用公众号技术文章风格，短段落，包含 6 个 sections。信息不足时必须写“启发/可尝试方向”，不能编造具体步骤。
8. 每条必须有 id, slug, type, category, source, sourceUrl, publishedAt, relativeTime, title, summary, tags, attentionLabel, attention, audience, visualKind, article。
9. visualKind 只能是 codex, research, image, skill, agent。

候选内容：
${JSON.stringify(selected.map(compactCandidate), null, 2)}`;

  const content = await generateText(
    {
      messages: [
        {
          role: "system",
          content: "你是严谨的中文 AI 工具学习站编辑。你只基于候选信息生成结构化 JSON，不编造候选中没有的事实。"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.25
    },
    limit
  );

  const parsed = JSON.parse(extractJson(content)) as { items?: Array<Partial<ContentItem> & { candidateIndex?: number }> };
  const rawItems = parsed.items ?? [];

  return {
    date,
    updatedCount: 20,
    items: rawItems.slice(0, 20).map((item, index) => {
      const candidate = selected[item.candidateIndex ?? index] ?? selected[index] ?? selected[0];
      return normalizeGeneratedItem(item, candidate, index);
    })
  };
}

import type { ContentItem, LatestData } from "./content-types";

const allowedTypes = new Set(["AI最新资讯", "实战案例", "工具教程", "工作流", "Skill/插件"]);
const allowedVisualKinds = new Set(["codex", "research", "image", "skill", "agent"]);

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateItem(item: ContentItem, index: number, seenSlugs: Set<string>) {
  assert(isNonEmptyString(item.id), `Item ${index} is missing id.`);
  assert(isNonEmptyString(item.slug), `Item ${item.id} is missing slug.`);
  assert(!seenSlugs.has(item.slug), `Duplicate slug: ${item.slug}`);
  seenSlugs.add(item.slug);

  assert(allowedTypes.has(item.type), `Item ${item.id} has invalid type ${item.type}.`);
  assert(isNonEmptyString(item.category), `Item ${item.id} is missing category.`);
  assert(isNonEmptyString(item.source), `Item ${item.id} is missing source.`);
  assert(isNonEmptyString(item.sourceUrl), `Item ${item.id} is missing sourceUrl.`);
  assert(isNonEmptyString(item.publishedAt), `Item ${item.id} is missing publishedAt.`);
  assert(isNonEmptyString(item.relativeTime), `Item ${item.id} is missing relativeTime.`);
  assert(isNonEmptyString(item.title), `Item ${item.id} is missing title.`);
  assert(item.title.length >= 8, `Item ${item.id} title is too short.`);
  assert(item.summary.length >= 30 && item.summary.length <= 320, `Item ${item.id} summary should be 30-320 Chinese chars.`);
  assert(Array.isArray(item.tags) && item.tags.length >= 2, `Item ${item.id} needs at least 2 tags.`);
  assert(allowedVisualKinds.has(item.visualKind), `Item ${item.id} has invalid visualKind.`);

  if (item.type === "AI最新资讯") {
    assert(item.attentionLabel === "为什么值得关注", `News item ${item.id} must use 为什么值得关注.`);
  } else {
    assert(item.attentionLabel === "解决什么问题", `Non-news item ${item.id} must use 解决什么问题.`);
  }

  assert(item.attention.length >= 18, `Item ${item.id} attention is too short.`);
  assert(isNonEmptyString(item.article?.quote), `Item ${item.id} is missing article quote.`);
  assert(Array.isArray(item.article?.originalContent) && item.article.originalContent.length >= 1, `Item ${item.id} needs originalContent.`);
  assert(Array.isArray(item.article?.sections) && item.article.sections.length >= 6, `Item ${item.id} needs at least 6 article sections.`);
  assert(Array.isArray(item.article?.tools) && item.article.tools.length >= 1, `Item ${item.id} needs tool roles.`);
}

export function validateLatest(data: LatestData) {
  assert(data.items.length === 20, `Expected exactly 20 items, got ${data.items.length}.`);
  assert(data.updatedCount === 20, `Expected updatedCount to be 20, got ${data.updatedCount}.`);

  const firstNonNews = data.items.findIndex((item) => item.type !== "AI最新资讯");
  const newsCount = firstNonNews === -1 ? data.items.length : firstNonNews;
  assert(newsCount >= 3 && newsCount <= 5, `Expected first 3-5 items to be AI latest updates, got ${newsCount}.`);

  const practicalCount = data.items.filter((item) => item.type !== "AI最新资讯").length;
  assert(practicalCount >= 15, `Expected at least 15 practical items, got ${practicalCount}.`);

  const seenSlugs = new Set<string>();
  data.items.forEach((item, index) => validateItem(item, index, seenSlugs));
}

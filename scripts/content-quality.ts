import type { ContentItem, LatestData } from "./content-types";

const allowedSourceKinds = new Set(["article", "video", "link"]);

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isVisibleMetric(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== "0" && !normalized.includes("待获取") && !normalized.includes("unknown") && !normalized.includes("n/a");
}

function isLowValueUpdateUrl(value: string) {
  const normalized = value.toLowerCase();
  return (
    (normalized.includes("github.com/") && normalized.includes("/releases")) ||
    normalized.includes("/changelog") ||
    normalized.includes("release-notes")
  );
}

function validateItem(item: ContentItem, index: number, seenSlugs: Set<string>) {
  assert(isNonEmptyString(item.id), `Item ${index} is missing id.`);
  assert(isNonEmptyString(item.slug), `Item ${item.id} is missing slug.`);
  assert(!seenSlugs.has(item.slug), `Duplicate slug: ${item.slug}`);
  seenSlugs.add(item.slug);

  assert(isNonEmptyString(item.author), `Item ${item.id} is missing author.`);
  assert(isNonEmptyString(item.platform), `Item ${item.id} is missing platform.`);
  assert(isNonEmptyString(item.sourceUrl), `Item ${item.id} is missing sourceUrl.`);
  assert(!isLowValueUpdateUrl(item.sourceUrl), `Item ${item.id} points to a low-value release/changelog URL.`);
  assert(allowedSourceKinds.has(item.sourceKind), `Item ${item.id} has invalid sourceKind.`);
  assert(isNonEmptyString(item.publishedAt), `Item ${item.id} is missing publishedAt.`);
  assert(!Number.isNaN(new Date(item.publishedAt).getTime()), `Item ${item.id} has invalid publishedAt.`);
  assert(isNonEmptyString(item.title), `Item ${item.id} is missing title.`);
  assert(item.title.length >= 8, `Item ${item.id} title is too short.`);
  assert(item.summary.length >= 30 && item.summary.length <= 260, `Item ${item.id} summary should be 30-260 Chinese chars.`);
  assert(Array.isArray(item.tags) && item.tags.length >= 2 && item.tags.length <= 6, `Item ${item.id} needs 2-6 tags.`);
  assert(isVisibleMetric(item.metrics?.reads), `Item ${item.id} has an unavailable reads metric.`);
  assert(isVisibleMetric(item.metrics?.views), `Item ${item.id} has an unavailable views metric.`);
  assert(isVisibleMetric(item.metrics?.likes), `Item ${item.id} has an unavailable likes metric.`);
  assert(isVisibleMetric(item.metrics?.stars), `Item ${item.id} has an unavailable stars metric.`);

  if (item.sourceKind === "video") {
    assert(isNonEmptyString(item.youtubeVideoId), `Video item ${item.id} needs youtubeVideoId.`);
  }
}

export function validateLatest(data: LatestData) {
  assert(data.items.length === 20, `Expected exactly 20 items, got ${data.items.length}.`);
  assert(data.updatedCount === 20, `Expected updatedCount to be 20, got ${data.updatedCount}.`);

  const seenSlugs = new Set<string>();
  data.items.forEach((item, index) => validateItem(item, index, seenSlugs));
}

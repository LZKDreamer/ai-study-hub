"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/content";
import { formatPublishedLabel, getItemHref } from "@/lib/content";

type HomeFeedProps = {
  items: ContentItem[];
};

function getMedia(item: ContentItem) {
  if (item.imageUrl) {
    return {
      src: item.imageUrl,
      alt: `${item.title} 封面图`
    };
  }

  if (item.youtubeVideoId) {
    return {
      src: `https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`,
      alt: `${item.title} 视频封面`
    };
  }

  return null;
}

function isVisibleMetric(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "0") return false;
  if (normalized.includes("待获取") || normalized.includes("unknown") || normalized.includes("n/a")) return false;
  return true;
}

function metricText(item: ContentItem) {
  const metrics = item.metrics;
  if (!metrics) return null;

  const parts = [
    isVisibleMetric(metrics.reads) ? `阅读 ${metrics.reads}` : null,
    isVisibleMetric(metrics.views) ? `观看 ${metrics.views}` : null,
    isVisibleMetric(metrics.likes) ? `点赞 ${metrics.likes}` : null,
    isVisibleMetric(metrics.stars) ? `Stars ${metrics.stars}` : null
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : null;
}

export function HomeFeed({ items }: HomeFeedProps) {
  return (
    <section className="feed" aria-label="AI 学习内容推荐列表">
      {items.map((item) => (
        <ArticleCard item={item} key={item.id} />
      ))}
    </section>
  );
}

function ArticleCard({ item }: { item: ContentItem }) {
  const media = getMedia(item);
  const metrics = metricText(item);

  return (
    <Link
      className={`case-card ${media ? "has-media" : ""}`}
      href={getItemHref(item)}
      aria-label={`打开来源：${item.title}`}
      rel="noreferrer"
      target="_blank"
    >
      <div className="card-body">
        <div className="meta-row">
          <span>{item.author}</span>
          <span>{item.platform}</span>
          <span>{formatPublishedLabel(item.publishedAt)}</span>
          {metrics ? <span>{metrics}</span> : null}
        </div>
        <h2>{item.title}</h2>
        <p className="summary">{item.summary}</p>
        <div className="tags">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      {media ? (
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={media.alt} src={media.src} />
        </div>
      ) : null}
    </Link>
  );
}

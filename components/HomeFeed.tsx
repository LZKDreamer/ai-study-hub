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
      alt: `${item.title} video thumbnail`
    };
  }

  if (item.youtubeVideoId) {
    return {
      src: `https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`,
      alt: `${item.title} video thumbnail`
    };
  }

  return null;
}

function ChannelAvatar({ item }: { item: ContentItem }) {
  if (!item.channelAvatarUrl) {
    return <span className="channel-avatar channel-avatar-fallback" aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="channel-avatar" alt="" src={item.channelAvatarUrl} loading="lazy" decoding="async" />
  );
}

function ExternalLinkIcon() {
  return (
    <span className="external-indicator" aria-hidden="true">
      <svg viewBox="0 0 20 20">
        <path d="M7 5H5.5A2.5 2.5 0 0 0 3 7.5v7A2.5 2.5 0 0 0 5.5 17h7A2.5 2.5 0 0 0 15 14.5V13" />
        <path d="M10 3h7v7" />
        <path d="m9 11 8-8" />
      </svg>
    </span>
  );
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

  return (
    <Link
      className={`case-card ${media ? "has-media" : ""}`}
      href={getItemHref(item)}
      aria-label={`打开来源：${item.title}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLinkIcon />
      {media ? (
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={media.alt} src={media.src} loading="lazy" decoding="async" />
        </div>
      ) : null}
      <div className="card-body">
        <h2 title={item.originalTitle || item.title}>{item.title}</h2>
        <div className="channel-row">
          <ChannelAvatar item={item} />
          <span>{item.author}</span>
          <span>{item.platform}</span>
          <span>{formatPublishedLabel(item.publishedAt)}</span>
        </div>
        <p className="summary">{item.summary}</p>
        <div className="tags">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

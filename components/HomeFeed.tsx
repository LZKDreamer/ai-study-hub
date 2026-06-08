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
    <img className="channel-avatar" alt="" src={item.channelAvatarUrl} />
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
      rel="noreferrer"
      target="_blank"
    >
      {media ? (
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={media.alt} src={media.src} />
        </div>
      ) : null}
      <div className="card-body">
        <h2>{item.originalTitle || item.title}</h2>
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

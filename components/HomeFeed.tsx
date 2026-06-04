"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ContentVisual } from "@/components/ContentVisual";
import type { ContentItem } from "@/lib/content";
import { filters, getItemHref } from "@/lib/content";

type HomeFeedProps = {
  items: ContentItem[];
};

function typeClassName(type: string) {
  if (type === "AI最新资讯") return "type-pill news";
  if (type === "工具教程") return "type-pill tutorial";
  if (type === "Skill/插件") return "type-pill skill";
  return "type-pill";
}

function matchesFilter(item: ContentItem, filter: string) {
  if (filter === "全部") return true;
  if (filter === "Codex") return item.tags.includes("Codex") || item.category === "Codex";
  return item.category === filter || item.type === filter;
}

export function HomeFeed({ items }: HomeFeedProps) {
  const [activeFilter, setActiveFilter] = useState("全部");

  const visibleItems = useMemo(
    () => items.filter((item) => matchesFilter(item, activeFilter)),
    [activeFilter, items]
  );

  return (
    <>
      <nav className="filters" aria-label="内容筛选">
        {filters.map((filter) => (
          <button
            className={`chip ${activeFilter === filter ? "active" : ""}`}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </nav>

      <section className="feed" aria-label="今日内容列表">
        {visibleItems.map((item, index) => (
          <Link
            className={`case-card ${item.featured || index === 0 ? "featured" : ""}`}
            href={getItemHref(item)}
            key={item.id}
            aria-label={`阅读全文：${item.title}`}
          >
            <div className="card-body">
              <div className="meta-row">
                <span className={typeClassName(item.type)}>{item.type}</span>
                <span>{item.source}</span>
                <span>{item.relativeTime}</span>
              </div>
              <h2>{item.title}</h2>
              <p className="summary">{item.summary}</p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="insight">
                <strong>{item.attentionLabel}</strong>
                <p>{item.attention}</p>
              </div>
              {item.audience ? (
                <p className="audience">
                  <strong>适合谁看：</strong>
                  {item.audience}
                </p>
              ) : null}
            </div>
            <ContentVisual item={item} />
            <span className="read-link">阅读全文</span>
          </Link>
        ))}
      </section>
    </>
  );
}

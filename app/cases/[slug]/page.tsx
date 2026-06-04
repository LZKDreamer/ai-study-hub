import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentVisual } from "@/components/ContentVisual";
import { SiteHeader } from "@/components/SiteHeader";
import {
  formatDateTime,
  getAllItems,
  getItemBySlug,
  getLatestData,
  getReadingMinutes
} from "@/lib/content";

type DetailPageProps = {
  params: Promise<{ slug: string }>;
};

function typeClassName(type: string) {
  if (type === "AI最新资讯") return "type-pill news";
  if (type === "工具教程") return "type-pill tutorial";
  if (type === "Skill/插件") return "type-pill skill";
  return "type-pill";
}

export function generateStaticParams() {
  return getAllItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    return { title: "内容不存在" };
  }

  return {
    title: item.title,
    description: item.summary
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const latest = getLatestData();
  const item = getItemBySlug(slug);

  if (!item) notFound();

  return (
    <>
      <SiteHeader updatedCount={latest.updatedCount} />
      <main className="article-shell">
        <Link className="back-link" href="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回列表
        </Link>

        <article className="article-page">
          <div className="article-meta">
            <span className={typeClassName(item.type)}>{item.type}</span>
            <span>{item.source}</span>
            <span>{formatDateTime(item.publishedAt)}</span>
            <span>阅读约 {getReadingMinutes(item)} 分钟</span>
          </div>

          <h1>{item.title}</h1>

          <blockquote>{item.article.quote}</blockquote>

          <div className="article-cover" aria-label={`${item.title} 示意图`}>
            <ContentVisual item={item} />
            <div className="cover-arrow" />
            <div className="cover-node">AI<br />提炼</div>
            <div className="cover-arrow" />
            <div className="cover-checks">
              <span>摘要</span>
              <span>步骤</span>
              <span>工具</span>
              <span>复用</span>
            </div>
          </div>

          <section className="original-note">
            <h2>原文内容 / 正文内容</h2>
            {item.article.originalContent.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          {item.article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section>
            <h2>工具分工</h2>
            <div className="tool-table" role="table" aria-label="工具分工">
              {item.article.tools.map((tool) => (
                <div key={tool.name} role="row">
                  <strong role="cell">{tool.name}</strong>
                  <span role="cell">{tool.role}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className="source-box">
            <strong>原文链接</strong>
            <a href={item.sourceUrl} rel="noreferrer" target="_blank">
              {item.sourceUrl}
            </a>
          </footer>
        </article>
      </main>
    </>
  );
}

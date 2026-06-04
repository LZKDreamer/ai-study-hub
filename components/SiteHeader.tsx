import Link from "next/link";

type SiteHeaderProps = {
  updatedCount: number;
};

export function SiteHeader({ updatedCount }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="AI Study Hub 首页">
        <span className="logo" aria-hidden="true">
          <span className="logo-dot" />
          <span className="logo-line" />
        </span>
        <span>
          <strong>AI Study Hub</strong>
          <small>AI tools, cases, workflows</small>
        </span>
      </Link>
      <div className="header-actions">
        <span>今日已更新 {updatedCount} 条</span>
        <button className="icon-button" type="button" aria-label="刷新">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12a9 9 0 0 1-15.3 6.4M3 12A9 9 0 0 1 18.3 5.6" />
            <path d="M21 4v6h-6M3 20v-6h6" />
          </svg>
        </button>
      </div>
    </header>
  );
}

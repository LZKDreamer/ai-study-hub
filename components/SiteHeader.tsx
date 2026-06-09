import Link from "next/link";

type SiteHeaderProps = {
  lastUpdatedLabel: string;
};

export function SiteHeader({ lastUpdatedLabel }: SiteHeaderProps) {
  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="AI Study Hub 首页">
          <span className="logo" aria-hidden="true">
            <svg className="logo-mark" viewBox="0 0 64 64" role="img">
              <defs>
                <linearGradient id="logoStroke" x1="8" x2="56" y1="52" y2="12">
                  <stop stopColor="#67e8f9" />
                  <stop offset="0.55" stopColor="#2dd4bf" />
                  <stop offset="1" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <path d="M10 42 28 22 52 14" />
              <path d="M14 24 28 22 40 42" />
              <path d="M10 42 40 42 52 14" />
              <circle cx="10" cy="42" r="4" />
              <circle cx="14" cy="24" r="3.5" />
              <circle cx="28" cy="22" r="5" />
              <circle cx="40" cy="42" r="4" />
              <circle cx="52" cy="14" r="3.5" />
              <path className="logo-spark" d="M46 7v9M41.5 11.5h9" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>
              AI Study <span>Hub</span>
            </strong>
            <small>站在AI的最前沿</small>
          </span>
        </Link>
        <div className="header-actions" aria-label="更新信息">
          <span className="status-dot" aria-hidden="true" />
          <span className="updated-label-full">最后更新 {lastUpdatedLabel}</span>
          <span className="updated-label-short">{lastUpdatedLabel} 更新</span>
        </div>
      </div>
    </header>
  );
}

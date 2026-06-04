import Link from "next/link";

type SiteHeaderProps = {
  lastUpdatedLabel: string;
};

export function SiteHeader({ lastUpdatedLabel }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="AI Study Hub 首页">
        <span className="logo" aria-hidden="true">
          <span className="logo-network">
            <i />
            <i />
            <i />
            <i />
            <i />
            <b />
          </span>
        </span>
        <span className="brand-copy">
          <strong>
            AI Study <span>Hub</span>
          </strong>
          <small>站在AI的最前沿</small>
        </span>
      </Link>
      <div className="header-actions">
        <span>最后更新 {lastUpdatedLabel}</span>
      </div>
    </header>
  );
}

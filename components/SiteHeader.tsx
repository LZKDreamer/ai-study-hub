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
                <radialGradient id="logoCore" cx="0.5" cy="0.5" r="0.5">
                  <stop stopColor="#f0fdfa" offset="0" />
                  <stop stopColor="#67e8f9" offset="0.4" />
                  <stop stopColor="#22c55e" offset="1" />
                </radialGradient>
                <radialGradient id="logoHalo" cx="0.5" cy="0.5" r="0.5">
                  <stop stopColor="rgba(103,232,249,0.55)" offset="0" />
                  <stop stopColor="rgba(34,197,94,0)" offset="0.7" />
                </radialGradient>
              </defs>

              <circle className="logo-halo" cx="32" cy="32" r="26" fill="url(#logoHalo)" />
              <circle className="logo-ring-outer" cx="32" cy="32" r="22" fill="none" stroke="url(#logoStroke)" strokeWidth="1" strokeDasharray="2 3" opacity="0.45" />
              <circle className="logo-ring-inner" cx="32" cy="32" r="14" fill="none" stroke="url(#logoStroke)" strokeWidth="1.2" strokeDasharray="1 2" opacity="0.6" />

              <g className="logo-axons" fill="none" stroke="url(#logoStroke)" strokeWidth="1.6" strokeLinecap="round">
                <path d="M32 10 L32 22" />
                <path d="M32 54 L32 42" />
                <path d="M10 32 L22 32" />
                <path d="M54 32 L42 32" />
                <path d="M16 16 L24 24" />
                <path d="M48 16 L40 24" />
                <path d="M16 48 L24 40" />
                <path d="M48 48 L40 40" />
              </g>

              <g className="logo-axons-secondary" fill="none" stroke="url(#logoStroke)" strokeWidth="1" strokeLinecap="round" opacity="0.55">
                <path d="M20 20 L27 27" />
                <path d="M44 20 L37 27" />
                <path d="M20 44 L27 37" />
                <path d="M44 44 L37 37" />
                <path d="M22 32 L27 32" />
                <path d="M42 32 L37 32" />
              </g>

              <g className="logo-nodes">
                <circle cx="32" cy="10" r="2.6" fill="#67e8f9" stroke="rgba(248,250,252,0.45)" strokeWidth="0.8" />
                <circle cx="32" cy="54" r="2.6" fill="#67e8f9" stroke="rgba(248,250,252,0.45)" strokeWidth="0.8" />
                <circle cx="10" cy="32" r="2.6" fill="#22c55e" stroke="rgba(248,250,252,0.45)" strokeWidth="0.8" />
                <circle cx="54" cy="32" r="2.6" fill="#22c55e" stroke="rgba(248,250,252,0.45)" strokeWidth="0.8" />
                <circle cx="16" cy="16" r="1.8" fill="#2dd4bf" opacity="0.85" />
                <circle cx="48" cy="16" r="1.8" fill="#2dd4bf" opacity="0.85" />
                <circle cx="16" cy="48" r="1.8" fill="#2dd4bf" opacity="0.85" />
                <circle cx="48" cy="48" r="1.8" fill="#2dd4bf" opacity="0.85" />
              </g>

              <circle className="logo-core-pulse" cx="32" cy="32" r="9" fill="url(#logoCore)" opacity="0.28" />
              <circle className="logo-core" cx="32" cy="32" r="6" fill="url(#logoCore)" stroke="rgba(248,250,252,0.55)" strokeWidth="1" />
              <circle cx="32" cy="32" r="2.2" fill="#f8fafc" />
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

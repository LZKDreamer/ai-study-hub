import type { ContentItem } from "@/lib/content";

type ContentVisualProps = {
  item: Pick<ContentItem, "visualKind" | "type">;
};

const labels: Record<ContentItem["visualKind"], string> = {
  codex: "Workflow",
  research: "Research",
  image: "Image AI",
  skill: "Skill",
  agent: "Agent"
};

export function ContentVisual({ item }: ContentVisualProps) {
  if (item.visualKind === "codex") {
    return (
      <div className="thumb thumb-codex" aria-hidden="true">
        <span>{labels[item.visualKind]}</span>
        <svg viewBox="0 0 160 96" aria-hidden="true">
          <path d="M26 50h30m48 0h30" />
          <rect x="12" y="25" width="42" height="42" rx="8" />
          <rect x="62" y="18" width="42" height="56" rx="8" />
          <rect x="112" y="25" width="36" height="42" rx="8" />
          <path d="M74 34h18M74 48h18M74 62h12" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`thumb thumb-${item.visualKind}`} aria-hidden="true">
      <span>{labels[item.visualKind]}</span>
    </div>
  );
}

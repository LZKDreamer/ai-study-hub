# YouTube AI Video Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert AI Study Hub's daily feed to YouTube-first AI learning video recommendations using YouTube Data API metadata and a horizontal video card layout.

**Architecture:** Keep the existing static JSON pipeline. Extend the shared content model, collect YouTube candidates from keyword searches, preserve original video metadata through AI summary generation, validate exactly 20 items, and render the new video card shape on the homepage.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Node fetch, YouTube Data API v3, existing AI provider adapter.

---

## File Structure

- Modify `scripts/content-types.ts`: add YouTube channel metadata fields to `ContentItem` and `Candidate`.
- Modify `lib/content.ts`: mirror the app-side content type additions.
- Modify `.env.example`: document `YOUTUBE_API_KEY`.
- Modify `scripts/content-sources.ts`: replace RSS/GitHub-first collection with YouTube API keyword search collection, while keeping generic helpers where useful.
- Modify `scripts/content-generation.ts`: preserve original YouTube metadata and only generate Chinese summaries and tags.
- Modify `scripts/content-quality.ts`: validate video-specific fields and ensure unavailable metrics are not emitted.
- Modify `components/HomeFeed.tsx`: render horizontal video cards with thumbnails and channel avatars; remove metrics display.
- Modify `app/globals.css`: implement desktop horizontal layout and mobile stacked layout.

No new dependencies are required.

---

### Task 1: Extend Content Types And Environment Contract

**Files:**
- Modify: `scripts/content-types.ts`
- Modify: `lib/content.ts`
- Modify: `.env.example`

- [ ] **Step 1: Update script-side content types**

In `scripts/content-types.ts`, extend `ContentItem`:

```ts
export type ContentItem = {
  id: string;
  slug: string;
  author: string;
  platform: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  youtubeVideoId?: string;
  channelId?: string;
  channelAvatarUrl?: string;
  originalTitle?: string;
  imageUrl?: string;
  publishedAt: string;
  title: string;
  summary: string;
  tags: string[];
  metrics?: ContentMetrics;
  featured?: boolean;
};
```

Extend `Candidate`:

```ts
export type Candidate = {
  id: string;
  author: string;
  platform: string;
  sourceUrl: string;
  title: string;
  originalTitle?: string;
  url: string;
  sourceKind: SourceKind;
  youtubeVideoId?: string;
  channelId?: string;
  channelAvatarUrl?: string;
  imageUrl?: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  candidateType: CandidateType;
  priority: number;
  metrics?: ContentMetrics;
};
```

- [ ] **Step 2: Update app-side content types**

Make the same `ContentItem` additions in `lib/content.ts`:

```ts
  youtubeVideoId?: string;
  channelId?: string;
  channelAvatarUrl?: string;
  originalTitle?: string;
  imageUrl?: string;
```

- [ ] **Step 3: Document YouTube API key**

Append this line to `.env.example`:

```dotenv
YOUTUBE_API_KEY=
```

- [ ] **Step 4: Verify type compatibility**

Run:

```powershell
npm run typecheck
```

Expected: PASS. Existing `data/latest.json` still loads because the new fields are optional.

- [ ] **Step 5: Commit**

```powershell
git add scripts/content-types.ts lib/content.ts .env.example
git commit -m "feat: add youtube channel metadata fields"
```

---

### Task 2: Add YouTube API Candidate Collection

**Files:**
- Modify: `scripts/content-sources.ts`
- Test: `npm run typecheck`
- Optional live test: `npm run collect:candidates`

- [ ] **Step 1: Replace source configuration with YouTube search keywords**

Add these constants near the top of `scripts/content-sources.ts`:

```ts
const youtubeSearchQueries = [
  "AI 教程",
  "AI 工具 使用",
  "ChatGPT 工作流",
  "Codex 使用",
  "Codex Skill",
  "Codex 插件",
  "AI Agent 教程",
  "MCP 教程",
  "Claude Code",
  "Gemini AI 教程",
  "AI 自动化",
  "AI 变现"
];

const searchMaxResults = 25;
const recentWindowDays = 180;
```

Keep `CandidateType` as-is so `candidateType: "youtube"` remains valid.

- [ ] **Step 2: Add YouTube API response types**

Add these types below the existing local type declarations:

```ts
type YouTubeThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: Record<string, YouTubeThumbnail>;
    channelTitle?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

type YouTubeChannelItem = {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: Record<string, YouTubeThumbnail>;
  };
};

type YouTubeChannelsResponse = {
  items?: YouTubeChannelItem[];
};
```

- [ ] **Step 3: Add URL and thumbnail helpers**

Add these helpers near `normalizeDate` and `slugPart`:

```ts
function youtubePublishedAfter() {
  return new Date(Date.now() - recentWindowDays * 86400000).toISOString();
}

function bestThumbnail(thumbnails: Record<string, YouTubeThumbnail> | undefined) {
  if (!thumbnails) return undefined;
  return (
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url
  );
}

function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeApiUrl(pathname: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${pathname}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}
```

- [ ] **Step 4: Add YouTube JSON fetcher**

Add this function after `fetchJson`:

```ts
async function fetchYouTubeJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AI Study Hub content collector (+https://github.com/LZKDreamer/ai-study-hub)"
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`YouTube API returned ${response.status}: ${body.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}
```

- [ ] **Step 5: Add channel avatar lookup**

Add this function before candidate collection:

```ts
async function fetchYouTubeChannels(apiKey: string, channelIds: string[]) {
  const channels = new Map<string, { title: string; avatarUrl?: string }>();
  const uniqueIds = Array.from(new Set(channelIds.filter(Boolean)));

  for (let index = 0; index < uniqueIds.length; index += 50) {
    const ids = uniqueIds.slice(index, index + 50);
    const url = youtubeApiUrl("channels", {
      part: "snippet",
      id: ids.join(","),
      key: apiKey
    });
    const data = await fetchYouTubeJson<YouTubeChannelsResponse>(url);

    for (const item of data.items ?? []) {
      if (!item.id) continue;
      channels.set(item.id, {
        title: item.snippet?.title?.trim() || item.id,
        avatarUrl: bestThumbnail(item.snippet?.thumbnails)
      });
    }
  }

  return channels;
}
```

- [ ] **Step 6: Add YouTube search collection**

Add this function:

```ts
async function collectYouTubeSearch(apiKey: string): Promise<Candidate[]> {
  const rawItems: YouTubeSearchItem[] = [];
  const publishedAfter = youtubePublishedAfter();

  for (const [queryIndex, query] of youtubeSearchQueries.entries()) {
    const url = youtubeApiUrl("search", {
      part: "snippet",
      type: "video",
      maxResults: searchMaxResults,
      q: query,
      relevanceLanguage: "zh-Hans",
      safeSearch: "none",
      publishedAfter,
      key: apiKey
    });
    const data = await fetchYouTubeJson<YouTubeSearchResponse>(url);
    rawItems.push(
      ...(data.items ?? []).map((item) => ({
        ...item,
        queryPriority: youtubeSearchQueries.length - queryIndex
      }))
    );
  }

  const channelMap = await fetchYouTubeChannels(
    apiKey,
    rawItems.map((item) => item.snippet?.channelId ?? "")
  );

  return rawItems.flatMap((item, index) => {
    const videoId = item.id?.videoId?.trim();
    const snippet = item.snippet;
    if (!videoId || !snippet) return [];

    const channelId = snippet.channelId?.trim();
    const channel = channelId ? channelMap.get(channelId) : undefined;
    const title = stripHtml(snippet.title ?? "").trim();
    const description = stripHtml(snippet.description ?? "");
    const author = channel?.title || snippet.channelTitle?.trim() || "YouTube";

    return [
      {
        id: `youtube-${videoId}`,
        author,
        platform: "YouTube",
        sourceUrl: youtubeWatchUrl(videoId),
        title,
        originalTitle: title,
        url: youtubeWatchUrl(videoId),
        sourceKind: "video" as const,
        youtubeVideoId: videoId,
        channelId,
        channelAvatarUrl: channel?.avatarUrl,
        imageUrl: bestThumbnail(snippet.thumbnails),
        publishedAt: normalizeDate(snippet.publishedAt),
        summary: description,
        tags: ["YouTube", "AI 学习"],
        candidateType: "youtube" as const,
        priority: 100 - index
      }
    ];
  });
}
```

If TypeScript rejects `queryPriority` because it is not part of `YouTubeSearchItem`, remove that mapping and rely on `index`-based priority.

- [ ] **Step 7: Tune learning filters for YouTube-only candidates**

Update `aiKeywords` to include readable Chinese strings:

```ts
const aiKeywords = [
  "ai",
  "chatgpt",
  "codex",
  "claude",
  "gemini",
  "openai",
  "mcp",
  "agent",
  "skill",
  "plugin",
  "workflow",
  "automation",
  "prompt",
  "llm",
  "rag",
  "教程",
  "实战",
  "项目",
  "案例",
  "工作流",
  "插件",
  "自动化",
  "提示词",
  "变现",
  "智能体"
];
```

Update `hasStrongTitleMatch`, `hasReusableSignal`, and `candidateQualityScore` to use these readable terms and remove metrics heat scoring from final ranking:

```ts
function hasStrongTitleMatch(value: string) {
  const title = value.toLowerCase();
  return aiKeywords.some((keyword) => title.includes(keyword.toLowerCase()));
}

function hasReusableSignal(candidate: Pick<Candidate, "title" | "summary">) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return /tutorial|guide|demo|walkthrough|workflow|automation|agent|mcp|skill|plugin|project|build|case|教程|指南|实战|案例|工作流|自动化|插件|项目|变现|复用|演示|使用/.test(value);
}
```

In `candidateQualityScore`, remove `heatScore(candidate.metrics)` from the returned expression.

- [ ] **Step 8: Make collectCandidates YouTube-first and failure tolerant**

Replace the body of `collectCandidates()` with:

```ts
export async function collectCandidates() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    return {
      candidates: [],
      failures: ["YOUTUBE_API_KEY not set; kept checked-in data."]
    };
  }

  try {
    const candidates = dedupe(await collectYouTubeSearch(apiKey))
      .filter((candidate) => candidate.title && candidate.url)
      .filter((candidate) => !isExcludedCandidate(candidate))
      .filter((candidate) => !looksLikeLowValueUpdate(candidate))
      .filter((candidate) => hasLearningValue(candidate))
      .sort((a, b) => {
        const quality = candidateQualityScore(b) - candidateQualityScore(a);
        if (quality !== 0) return quality;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 60);

    return { candidates, failures: [] };
  } catch (error) {
    return {
      candidates: [],
      failures: [`YouTube API: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}
```

- [ ] **Step 9: Verify without API key**

Run:

```powershell
npm run collect:candidates
```

Expected: command succeeds and prints `candidateCount: 0` with a failure mentioning `YOUTUBE_API_KEY not set`.

- [ ] **Step 10: Verify TypeScript**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit**

```powershell
git add scripts/content-sources.ts
git commit -m "feat: collect youtube ai video candidates"
```

---

### Task 3: Preserve YouTube Metadata During AI Generation

**Files:**
- Modify: `scripts/content-generation.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Include new metadata in compactCandidate**

Update `compactCandidate()` to include:

```ts
    originalTitle: candidate.originalTitle,
    channelId: candidate.channelId,
    channelAvatarUrl: candidate.channelAvatarUrl,
```

- [ ] **Step 2: Remove generated metrics cleaning from new YouTube items**

In `normalizeGeneratedItem()`, build `title` from candidate metadata:

```ts
  const title = candidate.originalTitle?.trim() || candidate.title;
```

Return these fields:

```ts
    sourceUrl: candidate.url,
    sourceKind,
    youtubeVideoId: candidate.youtubeVideoId,
    channelId: candidate.channelId,
    channelAvatarUrl: candidate.channelAvatarUrl,
    originalTitle: candidate.originalTitle || title,
    imageUrl: candidate.imageUrl,
    publishedAt: candidate.publishedAt,
    title,
    summary: item.summary?.trim() || fallbackSummary.slice(0, 180),
    tags,
    metrics: undefined,
```

- [ ] **Step 3: Rewrite the AI prompt requirements**

Replace the prompt text in `generateLatestFromCandidates()` with requirements that say:

```ts
const prompt = `You are generating today's 20 AI Study Hub YouTube learning recommendations.
Return JSON only, with this top-level shape: {"items":[...]}.

Hard requirements:
1. Output exactly 20 items.
2. Each item must include candidateIndex, summary, and tags.
3. Do not translate or rewrite YouTube titles.
4. Do not invent video facts beyond candidate metadata.
5. The recommendation summary must be Chinese, 80-160 Chinese characters.
6. Tags must be 2-6 short Chinese tags and should mention concrete tools or topics when present.
7. Do not output metrics, views, likes, reads, or stars.
8. Prefer videos about Codex, Codex Skills, MCP, AI Agents, AI workflows, AI tools, automation, tutorials, demos, projects, and monetization.
9. Filter out pure news, empty opinions, clickbait, generic hype, entertainment, and version-only updates.

Candidates:
${JSON.stringify(selected.map(compactCandidate), null, 2)}`;
```

Keep the system message but rewrite it in clear UTF-8 Chinese or English:

```ts
content: "You are a careful Chinese AI learning content editor. Only generate summaries and tags from candidate metadata. Preserve all source metadata."
```

- [ ] **Step 4: Verify fallback generation behavior**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add scripts/content-generation.ts
git commit -m "feat: preserve youtube metadata in generation"
```

---

### Task 4: Strengthen Validation For Video Feed Items

**Files:**
- Modify: `scripts/content-quality.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Require YouTube video fields**

Inside `validateItem()`, extend the `if (item.sourceKind === "video")` block:

```ts
  if (item.sourceKind === "video") {
    const videoId = item.youtubeVideoId;
    if (!isNonEmptyString(videoId)) throw new Error(`Video item ${item.id} needs youtubeVideoId.`);
    assert(!seenVideoIds.has(videoId), `Duplicate youtubeVideoId: ${videoId}`);
    seenVideoIds.add(videoId);

    assert(isNonEmptyString(item.imageUrl), `Video item ${item.id} needs imageUrl.`);
    assert(item.platform === "YouTube", `Video item ${item.id} should use YouTube platform.`);
  }
```

- [ ] **Step 2: Reject metrics on new YouTube items**

Add this check after metric visibility assertions:

```ts
  if (item.platform === "YouTube") {
    assert(!item.metrics, `YouTube item ${item.id} should not include metrics.`);
  }
```

- [ ] **Step 3: Verify TypeScript**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add scripts/content-quality.ts
git commit -m "feat: validate youtube video feed items"
```

---

### Task 5: Render Horizontal YouTube Video Cards

**Files:**
- Modify: `components/HomeFeed.tsx`
- Modify: `app/globals.css`
- Test: `npm run typecheck`

- [ ] **Step 1: Remove metrics helpers from `HomeFeed.tsx`**

Delete these functions:

```ts
function isVisibleMetric(value: string | undefined) {
  ...
}

function metricText(item: ContentItem) {
  ...
}
```

Remove this line from `ArticleCard`:

```ts
  const metrics = metricText(item);
```

Remove this render branch:

```tsx
          {metrics ? <span>{metrics}</span> : null}
```

- [ ] **Step 2: Fix media fallback labels**

Use readable alt text:

```ts
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
```

- [ ] **Step 3: Render media first and channel row second**

Update `ArticleCard` to this structure:

```tsx
function ChannelAvatar({ item }: { item: ContentItem }) {
  if (!item.channelAvatarUrl) {
    return <span className="channel-avatar channel-avatar-fallback" aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="channel-avatar" alt="" src={item.channelAvatarUrl} />
  );
}

function ArticleCard({ item }: { item: ContentItem }) {
  const media = getMedia(item);

  return (
    <Link
      className={`case-card ${media ? "has-media" : ""}`}
      href={getItemHref(item)}
      aria-label={`Open source: ${item.title}`}
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
        <h2>{item.title}</h2>
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
```

- [ ] **Step 4: Update desktop card CSS**

In `app/globals.css`, replace the current `.case-card.has-media`, `.card-media`, `.card-media img`, and `.meta-row` usage with:

```css
.case-card.has-media {
  grid-template-columns: 286px minmax(0, 1fr);
  align-items: stretch;
  min-height: 184px;
}

.card-body {
  min-width: 0;
  align-self: center;
}

.case-card h2 {
  margin: 0 0 0.48rem;
  font-size: clamp(1rem, 1.85vw, 1.32rem);
  line-height: 1.35;
}

.channel-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.48rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.channel-row span + span::before {
  content: "·";
  margin-right: 0.48rem;
  color: var(--faint);
}

.channel-avatar {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  object-fit: cover;
  background: rgba(15, 23, 42, 0.72);
}

.channel-avatar-fallback {
  display: inline-block;
  background:
    radial-gradient(circle at 38% 34%, rgba(125, 211, 252, 0.9) 0 3px, transparent 4px),
    linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(34, 197, 94, 0.16)),
    rgba(15, 23, 42, 0.86);
}

.card-media {
  position: relative;
  align-self: center;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.78);
}

.card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Keep `.meta-row` only if still used elsewhere. If not used, remove the `.meta-row` CSS blocks.

- [ ] **Step 5: Update mobile CSS**

Inside `@media (max-width: 860px)`, keep:

```css
  .case-card.has-media {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .card-media {
    order: -1;
    width: 100%;
    min-height: 0;
    aspect-ratio: 16 / 9;
  }
```

Inside `@media (max-width: 520px)`, replace `.meta-row` rules with:

```css
  .channel-row {
    gap: 0.36rem;
    font-size: 0.74rem;
  }

  .channel-row span + span::before {
    margin-right: 0.36rem;
  }

  .channel-avatar {
    width: 27px;
    height: 27px;
  }
```

- [ ] **Step 6: Verify TypeScript**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add components/HomeFeed.tsx app/globals.css
git commit -m "feat: render youtube video cards"
```

---

### Task 6: End-To-End Verification And Data Generation

**Files:**
- Potentially modifies: `data/latest.json`
- Potentially creates: `data/daily/YYYY-MM-DD.json`

- [ ] **Step 1: Verify static fallback without API keys**

Run:

```powershell
npm run generate:daily
```

Expected without `AI_API_KEY`: command succeeds and reports that checked-in static sample data was kept. `data/latest.json` remains valid.

- [ ] **Step 2: Verify candidate collection with YouTube key when available**

If `YOUTUBE_API_KEY` exists in the shell environment, run:

```powershell
npm run collect:candidates
```

Expected: JSON output with `candidateCount` greater than or equal to 20, and top candidates include `platform: "YouTube"` plus video URLs.

If `YOUTUBE_API_KEY` is not present, record that live YouTube verification was skipped.

- [ ] **Step 3: Verify daily generation with all keys when available**

If both `YOUTUBE_API_KEY` and `AI_API_KEY` are present, run:

```powershell
npm run generate:daily
```

Expected: `data/latest.json` contains exactly 20 YouTube video items with `youtubeVideoId`, `imageUrl`, `author`, `publishedAt`, `summary`, and `tags`. It should not contain metrics on YouTube items.

If AI credentials are not present, record that live AI generation was skipped.

- [ ] **Step 4: Run typecheck one final time**

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Start local dev server**

Run:

```powershell
npm run dev
```

Expected: Next.js starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 6: Browser visual check**

Open the local URL in the in-app browser or available browser tool. Check:

- Desktop width: thumbnail is left, content is right.
- Mobile width: thumbnail is on top.
- Original title is visible.
- Channel avatar or fallback circle is visible.
- Channel nickname, YouTube, and publish date are visible.
- No play count, like count, or star count appears.

- [ ] **Step 7: Commit generated data only if it was intentionally regenerated**

If live generation produced the desired new YouTube feed, commit it:

```powershell
git add data/latest.json data/daily
git commit -m "chore: update youtube ai video feed"
```

If live generation was skipped or failed safely, do not commit data churn.

---

## Self-Review

Spec coverage:

- Data model additions are covered in Task 1.
- YouTube API search, channel avatar lookup, keyword breadth, ranking, and fallback behavior are covered in Task 2.
- AI generation preserving original metadata and generating only Chinese summary/tags is covered in Task 3.
- Validation of exactly 20 items and video-specific metadata is covered in Task 4.
- Horizontal desktop card and mobile stacked layout are covered in Task 5.
- Typecheck, candidate collection, daily generation, and browser visual verification are covered in Task 6.

Placeholder scan:

- The plan contains no unresolved markers and no incomplete implementation steps.

Type consistency:

- The new fields are consistently named `channelId`, `channelAvatarUrl`, and `originalTitle` across script types, app types, generation, validation, and UI.

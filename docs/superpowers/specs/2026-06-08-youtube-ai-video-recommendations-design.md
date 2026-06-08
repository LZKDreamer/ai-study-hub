# YouTube AI Video Recommendations Design

Date: 2026-06-08

## Goal

AI Study Hub will shift its daily recommendation feed toward YouTube videos about practical AI learning. The feed should help the user broaden AI knowledge and learn how to use AI tools, especially Codex, Codex Skills, plugins, MCP, AI Agents, AI workflows, and practical AI automation.

The homepage remains a compact, single-column learning feed. Each card opens the original YouTube video directly.

## User-Facing Requirements

Each homepage item should show:

- YouTube video thumbnail.
- Original YouTube title, not translated.
- Channel avatar.
- Channel nickname.
- Published time.
- Chinese recommendation reason.
- Two to six Chinese tags.

The homepage should no longer show play count, like count, star count, content type labels, category chips, a "why this matters" section, target-audience sections, or a separate source button.

## Data Model

The current `ContentItem` shape remains compatible with existing data. Add these optional fields to both script-side and app-side types:

- `channelId`: YouTube channel ID.
- `channelAvatarUrl`: YouTube channel avatar URL.
- `originalTitle`: original YouTube video title.

For new YouTube items:

- `platform` is `YouTube`.
- `sourceKind` is `video`.
- `sourceUrl` is the canonical YouTube watch URL.
- `youtubeVideoId` is required.
- `imageUrl` is the best available YouTube thumbnail URL.
- `author` is the channel nickname.
- `title` uses the original YouTube title.
- `originalTitle` matches the original YouTube title.
- `summary` is a Chinese recommendation reason generated from collected metadata only.
- `metrics` is omitted.

Existing JSON can continue to load while the migration is in progress.

## YouTube Collection

The collector reads `YOUTUBE_API_KEY` from the environment. The key must live in `.env.local`, GitHub Secrets, or the deployment environment. It must not be committed.

The collector uses YouTube Data API v3:

- `search.list` to discover public videos.
- `channels.list` to fetch channel avatars and canonical channel metadata.

The default keyword set is broad enough to discover new creators instead of only recommending channels from the user's recent watch history:

- `AI 教程`
- `AI 工具 使用`
- `ChatGPT 工作流`
- `Codex 使用`
- `Codex Skill`
- `Codex 插件`
- `AI Agent 教程`
- `MCP 教程`
- `Claude Code`
- `Gemini AI 教程`
- `AI 自动化`
- `AI 变现`

Search parameters should favor Chinese AI learning content:

- `part=snippet`
- `type=video`
- `maxResults=25`
- `relevanceLanguage=zh-Hans`
- recent content window, initially 180 days

The user's recent video links are preference examples, not a fixed channel allowlist. They inform ranking keywords such as Codex, Skill, MCP, Agent, workflow, tutorial, project walkthrough, tool review, and practical AI usage.

## Ranking And Filtering

Filter for topic relevance first. A candidate should be about AI tool usage, Codex, Codex Skills, plugins, MCP, AI Agents, workflows, automation, monetization, tutorials, demos, project walkthroughs, or practical AI learning.

Increase score for:

- Specific AI tool usage.
- Codex, Skill, MCP, Agent, or workflow content.
- Tutorial, demo, guide, walkthrough, project, case, or automation signals.
- Chinese-language relevance.
- Specific and credible titles.
- Recent publication date.

Filter out:

- Pure news reposts.
- Empty opinions.
- Clickbait or emotional titles.
- Generic "AI changed everything" videos without concrete learning value.
- Live replays unless the title and description clearly indicate a reusable tutorial.
- Entertainment, music, and unrelated videos.
- Version-only updates without practical usage value.

Do not rank by view count, like count, or stars, and do not display those metrics.

## AI Generation

The existing provider-adapter flow remains. The AI generation step only creates:

- Chinese `summary`.
- Two to six `tags`.

The AI must preserve collected metadata:

- Original title.
- Source URL.
- Video ID.
- Channel name.
- Channel avatar URL.
- Thumbnail URL.
- Published time.

The prompt must explicitly forbid inventing video content. If metadata is insufficient, the generator should produce a conservative recommendation reason based on title, description snippet, and tags.

## Failure Handling

Daily generation remains failure tolerant:

- If `YOUTUBE_API_KEY` is missing, keep checked-in `data/latest.json`.
- If YouTube API calls fail, keep checked-in `data/latest.json`.
- If fewer than 20 valid candidates are collected, keep checked-in `data/latest.json`.
- If AI generation or validation fails, keep checked-in `data/latest.json`.

Validation must continue requiring exactly 20 items in `data/latest.json`.

## Homepage Layout

Use a horizontal video card on desktop:

- Left: fixed 16:9 thumbnail, about 260-300px wide.
- Right: original title, channel row, Chinese summary, tags.

The channel row contains:

- Circular channel avatar.
- Channel nickname.
- `YouTube`.
- Formatted publish date.

If `channelAvatarUrl` is missing, render a subtle circular fallback instead of a broken image.

On mobile:

- Thumbnail moves above text.
- Thumbnail fills the card width with a stable 16:9 ratio.
- Channel row can wrap to avoid overflow.

The visual style stays dark, compact, technical, and readable. Card radius remains at or below 8px. The whole card remains the link to the original YouTube video.

## Implementation Scope

Expected files:

- `scripts/content-types.ts`
- `lib/content.ts`
- `scripts/content-sources.ts`
- `scripts/content-generation.ts`
- `scripts/content-quality.ts`
- `components/HomeFeed.tsx`
- `app/globals.css`
- `.env.example`

No new runtime dependency is required.

## Verification

Run:

- `npm run typecheck`
- `npm run collect:candidates` when `YOUTUBE_API_KEY` is available
- `npm run generate:daily` when `YOUTUBE_API_KEY` and AI credentials are available
- local Next.js dev server visual check on desktop and mobile widths

Expected results:

- TypeScript passes.
- Candidate output contains YouTube video IDs, thumbnails, channel names, published times, and channel avatar URLs when available.
- `data/latest.json` remains exactly 20 items.
- Homepage cards show video thumbnails, original titles, channel avatar/name, publish date, Chinese summaries, and tags.
- Homepage no longer renders play count, like count, or star count.

# AI Study Hub

AI Study Hub is an AI learning content recommendation site. It helps readers find high-value articles, videos, and open source projects about AI tools, workflows, Skills, plugins, MCP, Agents, and practical AI monetization.

The current implementation is a Next.js data-driven static site:

- `app/page.tsx`: homepage recommendation feed with full-card original-source links.
- `components/`: shared UI components.
- `app/globals.css`: global dark space-themed reading style.
- `data/latest.json`: current 20-item recommendation data.
- `data/daily/YYYY-MM-DD.json`: daily index snapshots.
- `scripts/collect-candidates.ts`: candidate collection preview.
- `scripts/generate-daily.ts`: daily data validation/generation entrypoint.

The original `index.html`, `styles.css`, and `cases/.../index.html` files are kept as static preview references.

## Local Development

Install dependencies:

```powershell
npm.cmd install
```

Run the app:

```powershell
npm.cmd run dev
```

Then visit:

```text
http://localhost:3000/
```

## Content Direction

The site is not a generic AI news site. The homepage is a recommendation feed for readable learning content. Sources are not limited to Chinese content; English titles should be translated or adapted into Chinese for display.

Priority content:

1. Publicly accessible articles about AI tools, projects, workflows, Skills/plugins, AI Agents, MCP, and monetization.
2. YouTube videos with tutorials, demos, project walkthroughs, and tool reviews.
3. GitHub AI open source projects when repository description, stars, language, and update time are publicly available.
4. Juejin and other technical/creator platforms covering AI development, automation, prompts, plugins, and real projects.
5. AI updates only when they affect actual tool usage and are explained with learning value.

Homepage cards open the original article or video directly. There are no internal secondary article pages in the current product direction.

## Recommendation Algorithm

Candidates are filtered and ranked by:

- Topic match: ChatGPT, Codex, Claude, Gemini, OpenAI, Seedance, 豆包, 即梦, RunningHub, libtv, MCP, Agent, Skill, 插件, AI 工作流, GitHub 开源, AI 项目, AI 变现.
- Learning value: whether the content explains tool usage, steps, workflow, cost, limitations, or reusable methods.
- Practical value: whether it includes a real project, case, monetization path, automation workflow, or concrete output.
- Quality signals: trustworthy title, specific content, readable structure, and public engagement data when available.
- Freshness and source credibility.

Low-value items are filtered out:

- Pure news reposts.
- Empty opinions.
- Clickbait.
- Version-only updates.
- GitHub releases/changelogs without a Chinese learning article or video explaining practical value.

WeChat public account content cannot be reliably searched from the web. The collector should only process publicly accessible WeChat links or public metadata discovered through external indexes; it must not rely on private WeChat search or anti-crawler bypasses.

AI generation may create recommendation summaries and tags only. It must not invent article content or replace the original source.

## Data Shape

Each item in `data/latest.json` should include:

- `author`: author, channel, or account name.
- `platform`: WeChat, YouTube, Juejin, or another public platform.
- `sourceUrl`: original article or video URL.
- `sourceKind`: `article`, `video`, or `link`.
- `publishedAt`: ISO timestamp.
- `title`: original article or video title.
- `summary`: Chinese recommendation reason.
- `tags`: 2-6 generated tags.
- `youtubeVideoId` or `imageUrl` only when real media is available.

Keep `data/latest.json` at exactly 20 items unless the product requirement changes.

## AI Provider

The preferred default provider is Agnes AI using an OpenAI-compatible API shape.

Environment variables:

```text
AI_PROVIDER=agnes
AI_BASE_URL=https://apihub.agnes-ai.com/v1
AI_API_KEY=...
AI_MODEL=agnes-2.0-flash
MAX_DAILY_AI_CALLS=25
```

Never commit API keys. Use `.env.local`, GitHub Secrets, or Vercel environment variables.

## Daily Automation

Useful commands:

```powershell
npm.cmd run collect:candidates
npm.cmd run generate:daily
```

Behavior:

- `collect:candidates` gathers public candidates from RSS/Atom feeds, YouTube feeds, GitHub Search API, and manual public seed links.
- `generate:daily` uses Agnes AI only when `AI_API_KEY` is set.
- Without `AI_API_KEY`, `generate:daily` validates and keeps the checked-in data.
- If too few candidates are collected or generated content fails validation, the script falls back to checked-in data instead of publishing broken content.

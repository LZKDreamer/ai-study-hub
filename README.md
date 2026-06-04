# AI Study Hub

AI Study Hub is an AI learning website focused on practical AI tool usage, workflows, and important AI updates.

The project has moved from a static HTML preview to a Next.js data-driven site:

- `app/page.tsx`: homepage feed with filters and full-card links.
- `app/cases/[slug]/page.tsx`: generated article detail pages.
- `data/latest.json`: the current 20-item homepage and article data.
- `data/daily/YYYY-MM-DD.json`: daily index snapshots.
- `scripts/generate-daily.ts`: daily data generation/validation entrypoint.
- `.github/workflows/daily-content.yml`: scheduled content generation workflow.

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

This project is not a generic AI news site. The priority is:

1. AI latest updates that affect how tools are used.
2. Practical cases using Codex, ChatGPT, Nano Banana, AI Agents, MCP, Skills, and plugins.
3. Tool tutorials and reusable workflows.
4. General AI news only when it has clear learning value.

Each item explains why it matters or what problem it solves, and each item has a full article page.

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

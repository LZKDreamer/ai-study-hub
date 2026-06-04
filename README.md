# AI Study Hub

AI Study Hub is a static preview for an AI learning website focused on practical AI tool usage, workflows, and important AI updates.

The current version is intentionally simple:

- `index.html`: homepage with a compact feed of AI updates and practical cases.
- `cases/codex-github-actions-pr-review/index.html`: full article detail page.
- `styles.css`: shared dark technical visual system with lightweight star and particle effects.

## Local Preview

Open `index.html` directly in a browser, or run a local static server:

```powershell
D:\software\Python\python.exe -m http.server 4173 --bind 127.0.0.1
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Product Direction

This project is not a generic AI news site. The priority is:

1. AI latest updates that affect how tools are used.
2. Practical cases using Codex, ChatGPT, Nano Banana, AI Agents, MCP, Skills, and plugins.
3. Tool tutorials and reusable workflows.
4. General AI news only when it has clear learning value.

Each item should explain why it matters or what problem it solves, and each item should have a full article page.

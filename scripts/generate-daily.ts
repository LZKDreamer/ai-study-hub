import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDailyCallLimit, generateText } from "./ai-provider";

type LatestData = {
  date: string;
  updatedCount: number;
  items: Array<{
    id: string;
    slug: string;
    type: string;
    category: string;
    title: string;
    summary: string;
    attentionLabel: string;
    attention: string;
  }>;
};

const root = process.cwd();
const latestPath = path.join(root, "data", "latest.json");

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function validateLatest(data: LatestData) {
  if (data.items.length !== 20) {
    throw new Error(`Expected exactly 20 items, got ${data.items.length}.`);
  }

  const firstNonNews = data.items.findIndex((item) => item.type !== "AI最新资讯");
  const newsCount = firstNonNews === -1 ? data.items.length : firstNonNews;

  if (newsCount < 3 || newsCount > 5) {
    throw new Error(`Expected first 3-5 items to be AI latest updates, got ${newsCount}.`);
  }

  for (const item of data.items) {
    if (!item.title || !item.summary || !item.attention || !item.slug) {
      throw new Error(`Item ${item.id} is missing required homepage fields.`);
    }
  }
}

async function maybeGenerateEditorialNote(data: LatestData) {
  if (!process.env.AI_API_KEY) {
    return "AI_API_KEY not set; kept checked-in static sample data.";
  }

  const limit = createDailyCallLimit();
  const digest = data.items
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.title}`)
    .join("\n");

  return generateText(
    {
      messages: [
        {
          role: "system",
          content:
            "你是 AI Study Hub 的中文技术编辑。只输出 80 字以内的站内更新说明，不要编造来源。"
        },
        {
          role: "user",
          content: `今天的前 5 条内容如下：\n${digest}\n请写一句编辑说明。`
        }
      ],
      temperature: 0.3
    },
    limit
  );
}

async function main() {
  const raw = await readFile(latestPath, "utf8");
  const data = JSON.parse(raw) as LatestData;
  const date = todayInShanghai();

  data.date = date;
  data.updatedCount = data.items.length;
  validateLatest(data);

  const dailyPath = path.join(root, "data", "daily", `${date}.json`);
  await mkdir(path.dirname(dailyPath), { recursive: true });
  await writeFile(latestPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(
    dailyPath,
    `${JSON.stringify(
      {
        date,
        source: "data/latest.json",
        itemIds: data.items.map((item) => item.id)
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const note = await maybeGenerateEditorialNote(data);
  console.log(`Generated daily index for ${date}. ${note}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

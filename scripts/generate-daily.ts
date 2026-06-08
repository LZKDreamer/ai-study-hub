import "./load-env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDailyCallLimit } from "./ai-provider";
import { generateLatestFromCandidates } from "./content-generation";
import { validateLatest } from "./content-quality";
import { collectCandidates } from "./content-sources";
import type { LatestData } from "./content-types";

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

async function loadCheckedInLatest(date: string) {
  const raw = await readFile(latestPath, "utf8");
  const data = JSON.parse(raw) as LatestData;
  data.date = date;
  data.updatedCount = data.items.length;
  validateLatest(data);
  return data;
}

async function writeDailyFiles(data: LatestData) {
  const dailyPath = path.join(root, "data", "daily", `${data.date}.json`);
  await mkdir(path.dirname(dailyPath), { recursive: true });
  await writeFile(latestPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(
    dailyPath,
    `${JSON.stringify(
      {
        date: data.date,
        source: "data/latest.json",
        itemIds: data.items.map((item) => item.id)
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function buildLatest(date: string) {
  if (!process.env.AI_API_KEY) {
    const data = await loadCheckedInLatest(date);
    return {
      data,
      note: "AI_API_KEY not set; kept checked-in static sample data."
    };
  }

  const { candidates, failures } = await collectCandidates();
  if (candidates.length < 20) {
    const data = await loadCheckedInLatest(date);
    return {
      data,
      note: `Only collected ${candidates.length} candidates; kept checked-in data. Failures: ${failures.slice(0, 3).join(" | ")}`
    };
  }

  const limit = createDailyCallLimit();
  const data = await generateLatestFromCandidates(candidates, date, limit);
  validateLatest(data);

  return {
    data,
    note: `Collected ${candidates.length} candidates, generated ${data.items.length} items, used ${limit.count} AI call(s).${failures.length ? ` Source failures: ${failures.length}.` : ""}`
  };
}

async function main() {
  const date = todayInShanghai();
  const { data, note } = await buildLatest(date);
  await writeDailyFiles(data);
  console.log(`Generated daily index for ${date}. ${note}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});

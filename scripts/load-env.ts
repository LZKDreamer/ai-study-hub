import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const index = trimmed.indexOf("=");
  if (index <= 0) return null;

  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    process.env[parsed.key] ??= parsed.value;
  }
}

const root = process.cwd();

loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

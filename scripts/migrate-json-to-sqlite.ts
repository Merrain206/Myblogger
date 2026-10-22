import { copyFile, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { insertArchive, insertScore, openDatabase } from "../src/lib/database";
import { archiveRecordSchema } from "../src/lib/yijing/schemas";
import type { ScoreEntry } from "../src/lib/gomoku/types";

const archivePath = resolve(process.cwd(), "src/data/yijing-archives.json");
const scorePath = resolve(process.cwd(), "src/data/gomoku-scores.json");
const suffix = new Date().toISOString().replace(/[:.]/g, "-");

async function exists(path: string): Promise<boolean> {
  try { await stat(path); return true; } catch { return false; }
}

async function backup(path: string): Promise<void> {
  await copyFile(path, `${path}.backup-${suffix}`);
}

if (!openDatabase()) {
  console.error("请先配置 DATABASE_PATH。");
  process.exit(1);
}

let archivesImported = 0;
if (await exists(archivePath)) {
  await backup(archivePath);
  const records: unknown = JSON.parse(await readFile(archivePath, "utf8"));
  if (!Array.isArray(records)) throw new Error("存档 JSON 顶层必须是数组");
  for (const candidate of records) {
    const record = archiveRecordSchema.parse(candidate);
    if (insertArchive(record)) archivesImported += 1;
  }
}

let scoresImported = 0;
if (await exists(scorePath)) {
  await backup(scorePath);
  const records: unknown = JSON.parse(await readFile(scorePath, "utf8"));
  if (!Array.isArray(records)) throw new Error("成绩 JSON 顶层必须是数组");
  for (const candidate of records) {
    if (!candidate || typeof candidate !== "object") throw new Error("成绩记录格式错误");
    const score = candidate as ScoreEntry;
    if (insertScore(score, { trusted: false })) scoresImported += 1;
  }
}

console.log(`迁移完成：新增存档 ${archivesImported} 条，新增历史练习成绩 ${scoresImported} 条。原 JSON 未删除。`);

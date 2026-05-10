import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { ScoreEntry } from "@/lib/gomoku/types";

const DATA_PATH = path.join(process.cwd(), "src/data/gomoku-scores.json");

async function readScores(): Promise<ScoreEntry[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeScores(scores: ScoreEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(scores, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") as "pvp" | "pvai" | null;
  const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  let scores = await readScores();

  if (mode) scores = scores.filter((s) => s.mode === mode);
  if (difficulty) scores = scores.filter((s) => s.difficulty === difficulty);

  // 按难度排序（hard > medium > easy），再按最少步数排序（胜场），败场靠后
  const diffRank = { hard: 3, medium: 2, easy: 1 };
  scores.sort((a, b) => {
    const drA = a.difficulty ? (diffRank[a.difficulty] || 0) : 0;
    const drB = b.difficulty ? (diffRank[b.difficulty] || 0) : 0;
    if (drA !== drB) return drB - drA;
    if (a.result === "win" && b.result !== "win") return -1;
    if (a.result !== "win" && b.result === "win") return 1;
    if (a.result === "draw" && b.result !== "draw") return -1;
    if (a.result !== "draw" && b.result === "draw") return 1;
    return a.moves - b.moves;
  });

  return NextResponse.json(scores.slice(0, limit));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { playerName, mode, difficulty, result, moves } = body;

  if (!playerName || !mode || !result || typeof moves !== "number") {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  if (!["pvp", "pvai"].includes(mode)) {
    return NextResponse.json({ error: "无效模式" }, { status: 400 });
  }
  if (!["win", "loss", "draw"].includes(result)) {
    return NextResponse.json({ error: "无效结果" }, { status: 400 });
  }
  if (playerName.length > 20) {
    return NextResponse.json({ error: "昵称最长 20 个字符" }, { status: 400 });
  }

  const entry: ScoreEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    playerName: String(playerName).trim(),
    mode,
    difficulty: mode === "pvai" ? (difficulty || "medium") : null,
    result,
    moves,
    date: new Date().toISOString(),
  };

  const scores = await readScores();
  scores.push(entry);
  await writeScores(scores);

  return NextResponse.json(entry, { status: 201 });
}

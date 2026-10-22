import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ScoreEntry } from "@/lib/gomoku/types";
import type { ValidArchiveRecord } from "@/lib/yijing/schemas";

let database: DatabaseSync | null = null;
let databasePath: string | null = null;

function configuredPath(): string | null {
  const value = process.env.DATABASE_PATH?.trim();
  if (!value) return null;
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

export function openDatabase(): DatabaseSync | null {
  const path = configuredPath();
  if (!path) return null;
  if (database && databasePath === path) return database;
  if (database) database.close();

  mkdirSync(dirname(path), { recursive: true });
  const next = new DatabaseSync(path);
  next.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  next.exec(`
    CREATE TABLE IF NOT EXISTS archives (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS archives_owner_created
      ON archives(owner_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      player_name TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('pvp', 'pvai')),
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard') OR difficulty IS NULL),
      result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
      moves INTEGER NOT NULL CHECK (moves BETWEEN 1 AND 225),
      created_at TEXT NOT NULL,
      trusted INTEGER NOT NULL CHECK (trusted IN (0, 1)),
      UNIQUE(game_id, player_name)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS scores_trusted_created
      ON scores(trusted, created_at DESC);

    CREATE TABLE IF NOT EXISTS ai_usage (
      usage_day TEXT PRIMARY KEY,
      request_count INTEGER NOT NULL,
      token_estimate INTEGER NOT NULL,
      cost_micros INTEGER NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS auth_sessions (
      jti TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1))
    ) STRICT;
  `);
  database = next;
  databasePath = path;
  return next;
}

export function listArchives(ownerId = "admin"): ValidArchiveRecord[] {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const rows = db.prepare(
    "SELECT record_json FROM archives WHERE owner_id = ? ORDER BY created_at DESC LIMIT 500",
  ).all(ownerId) as { record_json: string }[];
  return rows.map((row) => JSON.parse(row.record_json) as ValidArchiveRecord);
}

export function insertArchive(record: ValidArchiveRecord, ownerId = "admin"): boolean {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const result = db.prepare(
    "INSERT OR IGNORE INTO archives (id, owner_id, record_json, created_at) VALUES (?, ?, ?, ?)",
  ).run(record.id, ownerId, JSON.stringify(record), record.timestamp);
  return result.changes === 1;
}

export function deleteArchive(id: string, ownerId = "admin"): boolean {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  return db.prepare("DELETE FROM archives WHERE id = ? AND owner_id = ?").run(id, ownerId).changes === 1;
}

export interface StoredScore extends ScoreEntry {
  trusted: boolean;
}

export function listScores(options: {
  mode?: "pvp" | "pvai";
  difficulty?: "easy" | "medium" | "hard";
  limit: number;
  trusted: boolean;
}): StoredScore[] {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const conditions = ["trusted = ?"];
  const params: (string | number)[] = [options.trusted ? 1 : 0];
  if (options.mode) { conditions.push("mode = ?"); params.push(options.mode); }
  if (options.difficulty) { conditions.push("difficulty = ?"); params.push(options.difficulty); }
  params.push(options.limit);
  const rows = db.prepare(`
    SELECT id, player_name, mode, difficulty, result, moves, created_at, trusted
    FROM scores WHERE ${conditions.join(" AND ")}
    ORDER BY CASE difficulty WHEN 'hard' THEN 3 WHEN 'medium' THEN 2 WHEN 'easy' THEN 1 ELSE 0 END DESC,
      CASE result WHEN 'win' THEN 3 WHEN 'draw' THEN 2 ELSE 1 END DESC,
      moves ASC, created_at DESC LIMIT ?
  `).all(...params) as Array<{
    id: string; player_name: string; mode: "pvp" | "pvai";
    difficulty: "easy" | "medium" | "hard" | null;
    result: "win" | "loss" | "draw"; moves: number; created_at: string; trusted: number;
  }>;
  return rows.map((row) => ({
    id: row.id,
    playerName: row.player_name,
    mode: row.mode,
    difficulty: row.difficulty,
    result: row.result,
    moves: row.moves,
    date: row.created_at,
    trusted: row.trusted === 1,
  }));
}

export function insertScore(entry: ScoreEntry, options: { gameId?: string; trusted: boolean }): boolean {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const result = db.prepare(`
    INSERT OR IGNORE INTO scores
      (id, game_id, player_name, mode, difficulty, result, moves, created_at, trusted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
    options.gameId || null,
    entry.playerName,
    entry.mode,
    entry.difficulty,
    entry.result,
    entry.moves,
    entry.date,
    options.trusted ? 1 : 0,
  );
  return result.changes === 1;
}

export function reserveAiQuota(options: {
  estimatedTokens: number;
  requestLimit: number;
  tokenLimit: number;
  costLimitMicros: number;
  estimatedCostMicros: number;
}): boolean {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const day = new Date().toISOString().slice(0, 10);
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = db.prepare(
      "SELECT request_count, token_estimate, cost_micros FROM ai_usage WHERE usage_day = ?",
    ).get(day) as { request_count: number; token_estimate: number; cost_micros: number } | undefined;
    const nextRequests = (current?.request_count || 0) + 1;
    const nextTokens = (current?.token_estimate || 0) + options.estimatedTokens;
    const nextCost = (current?.cost_micros || 0) + options.estimatedCostMicros;
    if (nextRequests > options.requestLimit || nextTokens > options.tokenLimit || nextCost > options.costLimitMicros) {
      db.exec("ROLLBACK");
      return false;
    }
    db.prepare(`
      INSERT INTO ai_usage (usage_day, request_count, token_estimate, cost_micros)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(usage_day) DO UPDATE SET
        request_count = excluded.request_count,
        token_estimate = excluded.token_estimate,
        cost_micros = excluded.cost_micros
    `).run(day, nextRequests, nextTokens, nextCost);
    db.exec("COMMIT");
    return true;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function registerAuthSession(jti: string, expiresAt: number): void {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  const now = Math.floor(Date.now() / 1000);
  db.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(now);
  db.prepare("INSERT INTO auth_sessions (jti, expires_at, revoked) VALUES (?, ?, 0)").run(jti, expiresAt);
}

export function authSessionIsActive(jti: string, now = Math.floor(Date.now() / 1000)): boolean {
  const db = openDatabase();
  if (!db) return false;
  const row = db.prepare(
    "SELECT 1 AS active FROM auth_sessions WHERE jti = ? AND revoked = 0 AND expires_at > ?",
  ).get(jti, now) as { active: number } | undefined;
  return row?.active === 1;
}

export function revokeAuthSession(jti: string): void {
  const db = openDatabase();
  if (!db) throw new Error("database unavailable");
  db.prepare("UPDATE auth_sessions SET revoked = 1 WHERE jti = ?").run(jti);
}

export function closeDatabaseForTests(): void {
  database?.close();
  database = null;
  databasePath = null;
}

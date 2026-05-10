"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ScoreEntry } from "@/lib/gomoku/types";

const DIFF_LABELS: Record<string, string> = { easy: "简单", medium: "中等", hard: "困难" };
const RESULT_LABELS: Record<string, string> = { win: "胜", loss: "负", draw: "平" };
const RESULT_COLORS: Record<string, string> = {
  win: "text-emerald-600 dark:text-emerald-400",
  loss: "text-red-500 dark:text-red-400",
  draw: "text-amber-500 dark:text-amber-400",
};

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "pvai" | "pvp">("all");
  const [filterDiff, setFilterDiff] = useState<"all" | "easy" | "medium" | "hard">("all");

  const fetchScores = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterMode !== "all") params.set("mode", filterMode);
    if (filterDiff !== "all") params.set("difficulty", filterDiff);
    params.set("limit", "50");

    fetch(`/api/gomoku/score?${params}`)
      .then((r) => r.json())
      .then((data) => setScores(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchScores(); }, [filterMode, filterDiff]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">排行榜</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">五子棋对战成绩</p>
      </div>

      {/* 过滤器 */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-700">
          {(["all", "pvai", "pvp"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                filterMode === m
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {{ all: "全部", pvai: "人机", pvp: "双人" }[m]}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-700">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDiff(d)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                filterDiff === d
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {{ all: "全部难度", easy: "简单", medium: "中等", hard: "困难" }[d]}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : scores.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 dark:text-slate-500">暂无记录</p>
          <Link href="/gomoku" className="mt-3 inline-block text-sm text-primary-500 hover:text-primary-600">
            去对局 →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">昵称</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">模式</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">难度</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">结果</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">步数</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {scores.map((entry, i) => (
                <tr
                  key={entry.id}
                  className="bg-white transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{entry.playerName}</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                    {entry.mode === "pvai" ? "人机" : "双人"}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                    {entry.difficulty ? DIFF_LABELS[entry.difficulty] : "-"}
                  </td>
                  <td className={`px-4 py-3 text-center font-semibold ${RESULT_COLORS[entry.result]}`}>
                    {RESULT_LABELS[entry.result]}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{entry.moves}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {new Date(entry.date).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/gomoku"
          className="rounded-xl bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition-all"
        >
          开始新对局
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

export default function GomokuPage() {
  const [mode, setMode] = useState<"pvai" | "online">("pvai");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* 头部 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
          五子棋
        </h1>
        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
          GOMOKU · 五目並べ · Gomoku Five-in-a-Row
        </p>
      </div>

      {/* 模式选择 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
          选择游戏模式
        </h2>

        {/* 模式 Tab */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => setMode("pvai")}
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
              mode === "pvai"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            人机对战
          </button>
          <Link
            href="/gomoku/online"
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
              mode === "online"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            在线对战
          </Link>
        </div>

        {/* 在线对战引导 */}
        {mode === "online" && (
          <div className="mb-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              与远方的好友实时对弈，点击下方按钮进入房间
            </p>
          </div>
        )}

        {/* 难度选择（仅人机模式） */}
        {mode === "pvai" && (
          <div className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-3">AI 难度</p>
            <div className="flex gap-3 justify-center">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    difficulty === d
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "border border-slate-200 text-slate-500 hover:border-slate-400 dark:border-slate-600 dark:text-slate-400"
                  }`}
                >
                  {{ easy: "简 单", medium: "中 等", hard: "困 难" }[d]}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
              {difficulty === "easy" && "启发式 AI，适合新手练习"}
              {difficulty === "medium" && "Minimax 深度 4，有一定挑战性"}
              {difficulty === "hard" && "Minimax 深度 6 + Alpha-Beta 剪枝，棋力强劲"}
            </p>
          </div>
        )}

        {/* 开始按钮 */}
        <div className="flex justify-center gap-4">
          {mode === "online" ? (
            <Link
              href="/gomoku/online"
              className="rounded-xl bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:-translate-y-0.5"
            >
              进入房间列表
            </Link>
          ) : (
            <Link
              href={`/gomoku/play?mode=${mode}${mode === "pvai" ? `&difficulty=${difficulty}` : ""}`}
              className="rounded-xl bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:-translate-y-0.5"
            >
              开始对局
            </Link>
          )}
          <Link
            href="/gomoku/leaderboard"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:-translate-y-0.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            排行榜
          </Link>
        </div>
      </div>

      {/* 说明 */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">玩法说明</h3>
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
          <li>· 黑方先行，双方轮流在 15x15 棋盘交叉点上落子</li>
          <li>· 先在横、竖、斜任一方向连成五子者获胜</li>
          <li>· 人机对战中，你执黑先行，AI 执白</li>
          <li>· 在线对战中，先进房间者为 Guest 1（黑方先行）</li>
          <li>· 支持悔棋（Ctrl+Z），人机模式一次撤销两步</li>
          <li>· 游戏结束后可将成绩提交到排行榜</li>
        </ul>
      </div>
    </div>
  );
}

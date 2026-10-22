"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { GameResult } from "@/lib/gomoku/types";

function PlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") || "pvai") as "pvai";
  const difficulty = (searchParams.get("difficulty") || "medium") as "easy" | "medium" | "hard";

  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 监听来自 iframe 的游戏结果
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
    const data = e.data as Record<string, unknown> | null;
    if (data?.type === "gomoku-result"
      && data.mode === "pvai"
      && ["easy", "medium", "hard"].includes(String(data.difficulty))
      && ["win", "loss", "draw"].includes(String(data.result))
      && Number.isSafeInteger(data.moves)
      && Number(data.moves) >= 1
      && Number(data.moves) <= 225) {
      setGameResult({
        mode: "pvai",
        difficulty: data.difficulty as "easy" | "medium" | "hard",
        result: data.result as "win" | "loss" | "draw",
        moves: Number(data.moves),
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const gameUrl = `/gomoku/index.html?mode=${mode}&difficulty=${difficulty}`;

  if (mode !== "pvai") {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">无效的游戏模式</p>
        <button onClick={() => router.push("/gomoku")} className="mt-4 text-primary-500">返回选择</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/gomoku")}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ← 返回大厅
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {`人机对战 · ${({ easy: "简单", medium: "中等", hard: "困难" } as const)[difficulty]}`}
        </span>
        <div className="w-16" /> {/* 占位保持居中 */}
      </div>

      {/* 游戏 iframe */}
      <div className="flex justify-center">
        <iframe
          ref={iframeRef}
          src={gameUrl}
          className="rounded-xl border border-slate-200 dark:border-slate-700"
          style={{ width: "100%", maxWidth: "660px", height: "780px" }}
          title="五子棋"
        />
      </div>

      {/* 人机结果只在本地展示，不进入可信在线排行榜。 */}
      {gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">
              {gameResult.result === "win" ? "恭喜获胜！" : gameResult.result === "loss" ? "遗憾落败" : "握手言和"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              共 {gameResult.moves} 手
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              人机对局由浏览器运行，仅作为练习记录，不进入可信在线排行榜。
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setGameResult(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                继续下棋
              </button>
              <button
                onClick={() => router.push("/gomoku")}
                className="flex-1 rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                返回大厅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">&#x26AB;</div>
            <p className="text-slate-500 dark:text-slate-400">加载中...</p>
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}

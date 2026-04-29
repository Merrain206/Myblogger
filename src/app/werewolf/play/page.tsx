"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { GameMode } from "@/lib/werewolf/types";
import GameBoard from "@/components/werewolf/GameBoard";

function PlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") || "god") as GameMode;
  const playerCount = Math.min(16, Math.max(6, Number(searchParams.get("players")) || 6));

  if (mode !== "human" && mode !== "god") {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">无效的游戏模式</p>
        <button
          onClick={() => router.push("/werewolf")}
          className="mt-4 text-primary-500 hover:text-primary-600"
        >
          返回选择
        </button>
      </div>
    );
  }

  return (
    <GameBoard mode={mode} playerCount={playerCount} onBack={() => router.push("/werewolf")} />
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl animate-bounce mb-4">🐺</div>
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}

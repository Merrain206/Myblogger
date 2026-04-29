"use client";

import type { Player } from "@/lib/werewolf/types";
import RoleCard from "./RoleCard";

export default function RoleReveal({
  player,
  onConfirm,
}: {
  player: Player;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-slate-300 text-sm">你的身份是</div>
        <RoleCard role={player.role} isYou />
        <p className="mt-4 text-sm text-slate-400">
          {player.role === "werewolf"
            ? "你和另一位狼人是同伴，夜晚共同决定击杀目标。白天假装好人！"
            : player.role === "seer"
            ? "每晚查验一名玩家身份。谨慎暴露自己，在关键时刻公布线索。"
            : player.role === "witch"
            ? "解药可以救人，毒药可以杀人。用对时机很关键！"
            : "没有特殊技能，通过分析发言和投票找出狼人。你的洞察力很重要！"}
        </p>
        <button
          onClick={onConfirm}
          className="mt-6 rounded-xl bg-primary-500 px-8 py-3 text-base font-semibold text-white hover:bg-primary-600 transition-colors"
        >
          确认身份，开始游戏
        </button>
      </div>
    </div>
  );
}

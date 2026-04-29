"use client";

import type { Player } from "@/lib/werewolf/types";
import { ROLE_INFO } from "@/lib/werewolf/constants";

const ROLE_COLORS: Record<string, string> = {
  werewolf: "border-red-500 bg-red-50 dark:bg-red-950",
  whiteWolfKing: "border-red-500 bg-red-50 dark:bg-red-950 ring-1 ring-yellow-400",
  wolfBeauty: "border-pink-400 bg-pink-50 dark:bg-pink-950",
  seer: "border-amber-400 bg-amber-50 dark:bg-amber-950",
  witch: "border-purple-500 bg-purple-50 dark:bg-purple-950",
  hunter: "border-orange-500 bg-orange-50 dark:bg-orange-950",
  guard: "border-cyan-500 bg-cyan-50 dark:bg-cyan-950",
  cupid: "border-pink-400 bg-pink-50 dark:bg-pink-950",
  idiot: "border-teal-500 bg-teal-50 dark:bg-teal-950",
  villager: "border-green-500 bg-green-50 dark:bg-green-950",
};

export default function PlayerAvatar({
  player,
  showRole = false,
  isCurrent = false,
  isLover = false,
  size = "md",
  onClick,
  disabled = false,
}: {
  player: Player;
  showRole?: boolean;
  isCurrent?: boolean;
  isLover?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const sizeClass =
    size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg";
  const ringClass = isCurrent ? "ring-2 ring-primary-400 ring-offset-2" : "";
  const alive = player.isAlive;
  const canClick = onClick && alive;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !alive}
      className={`flex flex-col items-center gap-1 transition-all relative ${
        canClick ? "cursor-pointer hover:scale-105" : ""
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center border-2 transition-all
          ${alive ? (ROLE_COLORS[player.role] || ROLE_COLORS.villager) : "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"}
          ${ringClass} ${!alive ? "opacity-50" : ""}`}
      >
        {alive ? (
          <span className="relative">
            {player.isHuman ? "😎" : "🤖"}
            {player.isSheriff && (
              <span className="absolute -top-1 -right-3 text-xs">⭐</span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">💀</span>
        )}
      </div>
      {isLover && alive && (
        <span className="absolute top-0 right-0 text-xs">💘</span>
      )}
      <div className="text-center">
        <div
          className={`text-xs font-medium ${
            alive
              ? "text-slate-700 dark:text-slate-300"
              : "text-slate-400 line-through dark:text-slate-500"
          }`}
        >
          {player.name}
          {player.isHuman && " (你)"}
          {player.isSheriff && " ⭐"}
        </div>
        {!player.canVote && alive && (
          <div className="text-[10px] text-teal-500">已亮身份</div>
        )}
        {showRole && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {ROLE_INFO[player.role].icon} {ROLE_INFO[player.role].name}
          </div>
        )}
      </div>
    </button>
  );
}

"use client";

import type { Role } from "@/lib/werewolf/types";
import { ROLE_INFO } from "@/lib/werewolf/constants";

const ROLE_BORDERS: Record<Role, string> = {
  werewolf: "border-red-400 bg-red-50 dark:bg-red-950/30",
  whiteWolfKing: "border-red-400 bg-yellow-50 dark:bg-yellow-950/30",
  wolfBeauty: "border-pink-400 bg-pink-50 dark:bg-pink-950/30",
  seer: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
  witch: "border-purple-400 bg-purple-50 dark:bg-purple-950/30",
  hunter: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
  guard: "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30",
  cupid: "border-pink-400 bg-rose-50 dark:bg-rose-950/30",
  idiot: "border-teal-400 bg-teal-50 dark:bg-teal-950/30",
  villager: "border-green-400 bg-green-50 dark:bg-green-950/30",
};

export default function RoleCard({
  role,
  isYou = false,
}: {
  role: Role;
  isYou?: boolean;
}) {
  const info = ROLE_INFO[role];
  return (
    <div
      className={`rounded-xl border-2 p-5 text-center ${ROLE_BORDERS[role]} ${
        isYou ? "ring-2 ring-primary-400 ring-offset-2" : ""
      }`}
    >
      <div className="text-4xl mb-2">{info.icon}</div>
      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
        {info.name}
        {isYou && (
          <span className="ml-2 text-xs bg-primary-500 text-white rounded-full px-2 py-0.5">
            你的身份
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {info.desc}
      </p>
      <div className="mt-2 text-xs text-slate-400">
        {info.team === "werewolves" ? "🐺 狼人阵营" : "🛡️ 好人阵营"}
      </div>
    </div>
  );
}

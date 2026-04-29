"use client";

import type { GameState } from "@/lib/werewolf/types";
import { ROLE_INFO } from "@/lib/werewolf/constants";

export default function GodViewOverlay({ state }: { state: GameState }) {
  const lastNight = state.nightActions[state.nightActions.length - 1];

  return (
    <div className="rounded-xl border-2 border-amber-400 bg-amber-50/80 p-4 dark:border-amber-600 dark:bg-amber-950/30">
      <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
        👁️ 上帝视角
      </h3>

      {/* 角色一览 */}
      <div className="mb-3">
        <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
          身份分配
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          {state.players.map((p) => (
            <span
              key={p.id}
              className={`px-1.5 py-0.5 rounded-full ${
                p.isAlive
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                  : "bg-slate-100 text-slate-400 line-through dark:bg-slate-800"
              }`}
            >
              {ROLE_INFO[p.role].icon} {p.name}{p.isSheriff ? "⭐" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* 情侣 */}
      {state.loverPairs.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-1">💘 情侣</div>
          {state.loverPairs.map(([a, b], i) => {
            const pa = state.players.find((p) => p.id === a);
            const pb = state.players.find((p) => p.id === b);
            return (
              <div key={i} className="text-xs text-pink-700 dark:text-pink-400">
                {pa?.name} 💘 {pb?.name}
              </div>
            );
          })}
        </div>
      )}

      {/* 夜晚行动 */}
      {lastNight && (
        <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <div className="font-medium text-amber-600 dark:text-amber-400 mb-1">
            第{lastNight.round}夜行动
          </div>
          {lastNight.cupidLink1 && (
            <div>💘 丘比特连线：{state.players.find((p) => p.id === lastNight.cupidLink1)?.name} ↔ {state.players.find((p) => p.id === lastNight.cupidLink2)?.name}</div>
          )}
          {lastNight.guardTarget && (
            <div>🛡️ 守卫守护：{state.players.find((p) => p.id === lastNight.guardTarget)?.name}</div>
          )}
          {lastNight.wolfBeautyCharmTarget && (
            <div>🌹 狼美人魅惑：{state.players.find((p) => p.id === lastNight.wolfBeautyCharmTarget)?.name}</div>
          )}
          {lastNight.killTarget && (
            <div>
              🐺 狼人选杀：{state.players.find((p) => p.id === lastNight.killTarget)?.name}
            </div>
          )}
          {lastNight.seerCheckTarget && (
            <div>
              🔮 预言家查验：{state.players.find((p) => p.id === lastNight.seerCheckTarget)?.name}
              {" → "}
              {ROLE_INFO[lastNight.seerCheckResult || "villager"].icon} {ROLE_INFO[lastNight.seerCheckResult || "villager"].name}
            </div>
          )}
          {lastNight.antidoteUsed && <div>🧙 女巫使用了解药</div>}
          {lastNight.poisonTarget && (
            <div>☠️ 女巫毒杀：{state.players.find((p) => p.id === lastNight.poisonTarget)?.name}</div>
          )}
          {lastNight.actualDeath ? (
            <div>💀 实际死亡：{state.players.find((p) => p.id === lastNight.actualDeath)?.name}</div>
          ) : lastNight.poisonTarget ? (
            <div>💀 实际死亡：{state.players.find((p) => p.id === lastNight.poisonTarget)?.name}</div>
          ) : (
            <div>✨ 平安夜</div>
          )}
        </div>
      )}
    </div>
  );
}

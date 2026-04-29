"use client";

import { useState } from "react";
import type { GameState } from "@/lib/werewolf/types";
import { ROLE_INFO } from "@/lib/werewolf/constants";

export default function GameLogPanel({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        📋 日志 {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 z-30">
          <h4 className="text-sm font-semibold text-slate-500 mb-2">游戏日志</h4>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            {/* 警长 */}
            {state.players.some((p) => p.isSheriff) && (
              <div className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-medium">⭐ 警长：</span>
                {state.players.find((p) => p.isSheriff)?.name}
              </div>
            )}

            {/* 情侣 */}
            {state.loverPairs.map(([a, b], i) => {
              const pa = state.players.find((p) => p.id === a);
              const pb = state.players.find((p) => p.id === b);
              return (
                <div key={i} className="pb-2 border-b border-slate-100 dark:border-slate-700">
                  💘 {pa?.name} ↔ {pb?.name}
                </div>
              );
            })}

            {/* 每晚行动 */}
            {state.nightActions.map((na, i) => (
              <div key={i} className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="font-medium">🌙 第{na.round}夜</div>
                {na.cupidLink1 && (
                  <div>💘 丘比特连线</div>
                )}
                {na.guardTarget && (
                  <div>🛡️ 守卫：{state.players.find((p) => p.id === na.guardTarget)?.name}</div>
                )}
                {na.wolfBeautyCharmTarget && (
                  <div>🌹 狼美人：{state.players.find((p) => p.id === na.wolfBeautyCharmTarget)?.name}</div>
                )}
                {na.killTarget && (
                  <div>🐺 选杀：{state.players.find((p) => p.id === na.killTarget)?.name}{na.antidoteUsed ? " (被救)" : ""}</div>
                )}
                {na.seerCheckTarget && (
                  <div>🔮 查验：{state.players.find((p) => p.id === na.seerCheckTarget)?.name} → {ROLE_INFO[na.seerCheckResult || "villager"].icon}</div>
                )}
                {na.antidoteUsed && <div>🧙 解药</div>}
                {na.poisonTarget && (
                  <div>☠️ 毒杀：{state.players.find((p) => p.id === na.poisonTarget)?.name}</div>
                )}
                {na.actualDeath ? (
                  <div>💀 死亡：{state.players.find((p) => p.id === na.actualDeath)?.name}</div>
                ) : na.poisonTarget ? (
                  <div>💀 死亡：{state.players.find((p) => p.id === na.poisonTarget)?.name}</div>
                ) : (
                  <div>✨ 平安夜</div>
                )}
              </div>
            ))}

            {/* 讨论统计 */}
            {state.chatMessages.length > 0 && (
              <div className="pt-1">
                <div className="font-medium">💬 发言 ({state.chatMessages.length}条)</div>
              </div>
            )}

            {/* 投票 */}
            {state.votes.length > 0 && (
              <div>
                <div className="font-medium">🗳️ 投票</div>
                {(() => {
                  const tally = new Map<string, number>();
                  state.votes.forEach((v) => {
                    const weight = state.players.find((p) => p.id === v.voterId)?.isSheriff ? 2 : 1;
                    tally.set(v.targetId, (tally.get(v.targetId) || 0) + weight);
                  });
                  return [...tally.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([id, count]) => (
                      <div key={id}>
                        {state.players.find((p) => p.id === id)?.name}: {count}票
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

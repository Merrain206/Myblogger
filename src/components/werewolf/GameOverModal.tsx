"use client";

import type { GameState, Player } from "@/lib/werewolf/types";
import { ROLE_INFO } from "@/lib/werewolf/constants";

function VoteTally({ votes, players, roundLabel }: { votes: { voterId: string; targetId: string }[]; players: Player[]; roundLabel: string }) {
  const tally = new Map<string, { count: number; voters: string[] }>();
  for (const v of votes) {
    const target = players.find((p) => p.id === v.targetId);
    const name = target?.name || v.targetId;
    const voter = players.find((p) => p.id === v.voterId);
    if (!tally.has(name)) tally.set(name, { count: 0, voters: [] });
    tally.get(name)!.count++;
    tally.get(name)!.voters.push(voter?.name || v.voterId);
  }
  const entries = [...tally.entries()].sort((a, b) => b[1].count - a[1].count);
  const maxVotes = entries[0]?.[1].count || 0;
  const tie = entries.filter(([, v]) => v.count === maxVotes).length > 1;

  return (
    <div className="text-xs">
      <span className="font-medium text-slate-500">{roundLabel}投票：</span>
      {entries.map(([name, info]) => (
        <span key={name} className="ml-1">
          {name}({info.count}票
          {info.count === maxVotes && !tie ? " 💀" : ""})
        </span>
      ))}
      {tie && <span className="ml-1 text-amber-500">平票无人出局</span>}
    </div>
  );
}

export default function GameOverModal({
  state,
  onRestart,
  onBack,
}: {
  state: GameState;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { winner, players, nightActions, chatMessages } = state;
  const wolvesWin = winner === "werewolves";
  const loversWin = winner === "lovers";

  // Build round-by-round log
  const maxRound = state.round;
  const rounds: number[] = [];
  for (let r = 1; r <= maxRound; r++) rounds.push(r);

  // Group votes by round (votes are cleared each round, we track them via nightActions timing)
  // Votes happen in round N, then phase goes to VOTE_RESULT, then round increments to N+1 in doVoteResult
  // So when a vote result is processed, round becomes current+1, meaning the vote was for the previous round
  // Actually: doVoteResult increments this.state.round++ after processing votes.
  // So if round is now 3, the vote that just happened was for round 2.
  // We display votes alongside the round they occurred in.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        {/* winner banner */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{loversWin ? "💘" : wolvesWin ? "🐺" : "🛡️"}</div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {loversWin ? "情侣阵营获胜！" : wolvesWin ? "狼人阵营获胜！" : "好人阵营获胜！"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loversWin
              ? "爱情战胜了一切..."
              : wolvesWin
              ? "狼人成功占据了村庄..."
              : "好人成功消灭了所有狼人！"}
          </p>
        </div>

        {/* player identities */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-3 text-center">
            身份揭晓
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`rounded-lg border p-3 text-center ${
                  p.isAlive
                    ? "border-slate-200 dark:border-slate-600"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                }`}
              >
                <div className="text-xl mb-1">{ROLE_INFO[p.role].icon}</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {p.name}{p.isSheriff ? " ⭐" : ""}
                </div>
                <div className="text-[10px] text-slate-400">
                  {ROLE_INFO[p.role].name}
                </div>
                {!p.isAlive && (
                  <div className="text-[10px] text-red-500">💀 已死亡</div>
                )}
                {state.loverPairs.some(([a, b]) => a === p.id || b === p.id) && (
                  <div className="text-[10px] text-pink-500">💘 情侣</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* round-by-round timeline */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-3 text-center">
            游戏复盘
          </h3>
          <div className="space-y-3">
            {state.nightActions.map((na) => {
              // Find votes that happened after this night (same round)
              // Votes are processed in doVoteResult which increments round.
              // The vote that follows night N is for round N, and after processing round becomes N+1.
              // So the night action for round N is followed by votes that were cast in round N.
              // We don't have a round field on votes, so we'll show all votes after the last night action.
              const nightRound = na.round;
              const deathName = na.actualDeath
                ? players.find((p) => p.id === na.actualDeath)?.name
                : null;
              const poisonName = na.poisonTarget
                ? players.find((p) => p.id === na.poisonTarget)?.name
                : null;
              const seerTarget = na.seerCheckTarget
                ? players.find((p) => p.id === na.seerCheckTarget)?.name
                : null;
              const seerResult = na.seerCheckResult
                ? ROLE_INFO[na.seerCheckResult].name
                : null;

              return (
                <div
                  key={nightRound}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    🌙 第{nightRound}夜
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {na.killTarget && (
                      <div>
                        狼人选杀：{players.find((p) => p.id === na.killTarget)?.name}
                        {na.antidoteUsed && "（女巫救活）"}
                      </div>
                    )}
                    {!na.killTarget && <div>狼人未行动（首夜跳过）</div>}
                    {seerTarget && (
                      <div>
                        预言家查验：{seerTarget} → {seerResult}
                      </div>
                    )}
                    {na.antidoteUsed && !na.killTarget && (
                      <div>女巫使用解药</div>
                    )}
                    {poisonName && (
                      <div>
                        女巫毒杀：{poisonName}
                      </div>
                    )}
                    <div className="font-medium text-slate-600 dark:text-slate-300">
                      {deathName
                        ? `💀 ${deathName}死亡`
                        : na.poisonTarget
                        ? `💀 ${poisonName}死亡`
                        : "✨ 平安夜"}
                    </div>
                  </div>

                  {/* chat for this round */}
                  {(() => {
                    const roundMsgs = chatMessages.filter(
                      (m) => m.round === nightRound && m.phase === "discuss"
                    );
                    if (roundMsgs.length === 0) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          💬 第{nightRound}天讨论
                        </div>
                        {roundMsgs.map((m, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                          >
                            <span className="font-medium">
                              {m.speakerName}：
                            </span>
                            {m.text}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* show last day's discussion if any */}
            {chatMessages.filter((m) => m.round === maxRound && m.phase === "discuss").length > 0 && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  ☀️ 第{maxRound}天讨论
                </div>
                {chatMessages
                  .filter((m) => m.round === maxRound && m.phase === "discuss")
                  .map((m, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                    >
                      <span className="font-medium">{m.speakerName}：</span>
                      {m.text}
                    </div>
                  ))}
              </div>
            )}

            {/* votes summary */}
            {state.votes.length > 0 && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  🗳️ 最后投票
                </div>
                <VoteTally votes={state.votes} players={players} roundLabel="" />
              </div>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 text-center">
            统计
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
              总轮数：{maxRound}
            </div>
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
              总发言：{chatMessages.length}条
            </div>
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
              存活：{players.filter((p) => p.isAlive).length}/{players.length}
            </div>
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
              死亡：{players.filter((p) => !p.isAlive).length}/{players.length}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            返回
          </button>
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}

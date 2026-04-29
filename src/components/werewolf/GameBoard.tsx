"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, GameMode, Player } from "@/lib/werewolf/types";
import { GameEngine } from "@/lib/werewolf/engine";
import { PHASE_LABELS, ROLE_INFO } from "@/lib/werewolf/constants";
import { isWolfRole } from "@/lib/werewolf/utils";
import PlayerList from "./PlayerList";
import DayDiscussion from "./DayDiscussion";
import VotePanel from "./VotePanel";
import NightPhaseOverlay from "./NightPhaseOverlay";
import NightActionPanel, { HunterShootPanel } from "./NightActionPanel";
import RoleReveal from "./RoleReveal";
import GodViewOverlay from "./GodViewOverlay";
import GameOverModal from "./GameOverModal";
import GameLogPanel from "./GameLogPanel";
import PlayerAvatar from "./PlayerAvatar";

function CountdownBar({ seconds, label }: { seconds: number; label: string }) {
  const max = label === "sheriff" ? 20 : label === "discuss" ? 60 : 15;
  const pct = Math.max(0, (seconds / max) * 100);
  const urgent = seconds <= 5;
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-12">{label}</span>
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
        <div className={`h-full rounded-full transition-all duration-500 ${urgent ? "bg-red-500 animate-pulse" : "bg-primary-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold w-8 text-right ${urgent ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>{seconds}s</span>
    </div>
  );
}

export default function GameBoard({ mode, playerCount, onBack }: { mode: GameMode; playerCount: number; onBack: () => void }) {
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [thinking, setThinking] = useState<Record<string, string>>({});
  const [showRole, setShowRole] = useState(mode === "human");
  const [paused, setPaused] = useState(false);
  const [humanTarget, setHumanTarget] = useState<Player | null>(null);
  const [humanTarget2, setHumanTarget2] = useState<Player | null>(null);
  const [chatInput, setChatInput] = useState("");
  const autoPlayRunning = useRef(false);
  const phaseRef = useRef<string>("");

  useEffect(() => { if (state) phaseRef.current = state.phase; }, [state]);

  // Reset selection on phase change
  useEffect(() => {
    setHumanTarget(null);
    setHumanTarget2(null);
  }, [state?.phase, state?.round]);

  // init engine
  useEffect(() => {
    const engine = new GameEngine(mode, playerCount);
    engineRef.current = engine;
    engine.subscribe(
      (ns) => setState({ ...ns }),
      (pid, txt) => setThinking((prev) => ({ ...prev, [pid]: txt }))
    );
    engine.advance();
    return () => { engine.abort(); };
  }, [mode, playerCount]);

  const engine = engineRef.current;
  const human = engine?.getHumanPlayer();

  // god mode: run autoPlay once
  useEffect(() => {
    if (mode !== "god" || !engine || !state) return;
    if (autoPlayRunning.current) return;
    if (state.phase === "GAME_OVER") return;
    autoPlayRunning.current = true;
    engine.autoPlay().finally(() => { autoPlayRunning.current = false; });
    return () => { autoPlayRunning.current = false; engine.abort(); };
  }, [mode, engine, !!state]);

  // human mode: auto-advance non-interactive phases
  useEffect(() => {
    if (mode !== "human" || !engine || !state) return;
    if (state.phase === "GAME_OVER" || state.phase === "SETUP") return;
    if (showRole) return;

    const engineBusy =
      state.expectedHumanAction !== null ||
      (state.phase === "SHERIFF_VOTE" && human?.isAlive && human.canVote) ||
      (state.phase === "DAY_VOTE" && human?.isAlive && human.canVote && state.countdownSeconds >= 0);

    if (engineBusy) return;

    const t = setTimeout(() => { engine.advance(); }, 800);
    return () => clearTimeout(t);
  }, [mode, engine, state?.phase, state?.countdownSeconds, state?.expectedHumanAction, showRole, human?.isAlive, human?.canVote]);

  // ── human actions ──

  const submitNightAction = useCallback(async (action: any) => {
    if (!engine) return;
    await engine.submitHumanAction(action);
  }, [engine]);

  const submitVote = useCallback(async (targetId: string) => {
    if (!engine) return;
    await engine.submitHumanAction({ type: "vote", voteTargetId: targetId });
  }, [engine]);

  const submitChat = useCallback(() => {
    if (!engine || !chatInput.trim()) return;
    engine.submitHumanAction({ humanText: chatInput.trim() });
    setChatInput("");
  }, [engine, chatInput]);

  if (!state) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><div className="text-4xl animate-bounce mb-4">🐺</div><p className="text-slate-500">Loading...</p></div></div>;
  }

  const isNight = state.phase === "NIGHT";
  const isDiscuss = state.phase === "DAY_DISCUSS";
  const isVote = state.phase === "DAY_VOTE";
  const isSheriffVote = state.phase === "SHERIFF_VOTE";
  const isGameOver = state.phase === "GAME_OVER";
  const isGod = mode === "god";

  const expectedAction = state.expectedHumanAction;
  const countdownLabel = isSheriffVote ? "sheriff" : isDiscuss ? "discuss" : "vote";

  const roleLabels: Record<string, string> = {};
  if (isGod) state.players.forEach((p) => { roleLabels[p.id] = ROLE_INFO[p.role].name; });

  // Get lover partner name for display
  const loverPartnerName = (() => {
    if (!human) return null;
    for (const [a, b] of state.loverPairs) {
      if (a === human.id || b === human.id) {
        const partner = state.players.find((p) => p.id === (a === human.id ? b : a));
        return partner?.name || null;
      }
    }
    return null;
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* top bar */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">← back</button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            R{state.round} · {PHASE_LABELS[state.phase]}
          </span>
          {isGod && (
            <button onClick={() => setPaused(!paused)} className={`text-xs px-3 py-1 rounded-lg border ${paused ? "border-green-400 text-green-600" : "border-amber-400 text-amber-600"}`}>
              {paused ? "▶ play" : "⏸ pause"}
            </button>
          )}
          <GameLogPanel state={state} />
        </div>
      </div>

      {/* countdown bar */}
      {state.countdownSeconds >= 0 && mode === "human" && (
        <CountdownBar seconds={state.countdownSeconds} label={countdownLabel} />
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {/* sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PlayerList
            players={state.players}
            showRoles={isGod}
            loverPairs={state.loverPairs}
            currentSpeakerId={thinking ? Object.keys(thinking).pop() : undefined}
          />
          {isGod && <GodViewOverlay state={state} />}

          {/* human wolf partners */}
          {mode === "human" && human?.isAlive && isWolfRole(human.role) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-xs text-red-600 dark:text-red-400">
                同伴：{state.players.filter((p) => isWolfRole(p.role) && p.id !== human?.id).map((p) => `${p.name}(${ROLE_INFO[p.role].icon})`).join(", ")}
              </p>
            </div>
          )}

          {/* human witch status */}
          {mode === "human" && human?.role === "witch" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
              <p className="text-xs text-purple-600 dark:text-purple-400">解药：{state.witchHasAntidote ? "有" : "已用"} | 毒药：{state.witchHasPoison ? "有" : "已用"}</p>
            </div>
          )}

          {/* human seer last check */}
          {mode === "human" && human?.role === "seer" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs text-amber-700 dark:text-amber-400">上次查验：{(() => {
                const na = state.nightActions[state.nightActions.length - 1];
                if (na?.seerCheckTarget && na.seerCheckResult) {
                  const t = state.players.find((p) => p.id === na.seerCheckTarget);
                  return `${t?.name} 是 ${ROLE_INFO[na.seerCheckResult].name}`;
                }
                return "暂无";
              })()}</p>
            </div>
          )}

          {/* human guard last protect */}
          {mode === "human" && human?.role === "guard" && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-950/30">
              <p className="text-xs text-cyan-700 dark:text-cyan-400">上次守护：{(() => {
                const na = state.nightActions[state.nightActions.length - 1];
                if (na?.guardTarget) {
                  const t = state.players.find((p) => p.id === na.guardTarget);
                  return t?.name || "无";
                }
                return "无";
              })()}</p>
            </div>
          )}

          {/* human lover info */}
          {mode === "human" && loverPartnerName && (
            <div className="rounded-xl border border-pink-200 bg-pink-50 p-3 dark:border-pink-800 dark:bg-pink-950/30">
              <p className="text-xs text-pink-600 dark:text-pink-400">💘 情侣：{loverPartnerName}</p>
            </div>
          )}

          {/* human white wolf king status */}
          {mode === "human" && human?.role === "whiteWolfKing" && human.isAlive && !state.whiteWolfKingExploded && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">⚡ 可在白天讨论时自爆带走一人</p>
            </div>
          )}
        </div>

        {/* main area */}
        <div className="lg:col-span-3 space-y-4">
          {/* night */}
          {isNight && (expectedAction && human ? (
            <NightActionPanel
              state={state} human={human}
              humanTarget={humanTarget} humanTarget2={humanTarget2}
              onSelectTarget={(p) => setHumanTarget(p)}
              onSelectTarget2={(p) => setHumanTarget2(p)}
              onSubmit={submitNightAction}
            />
          ) : (
            <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-slate-50 p-8 dark:border-indigo-800 dark:from-indigo-950/50 dark:to-slate-800/50">
              <div className="text-center py-8">
                <div className="text-5xl mb-4 animate-pulse">🌙</div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Night {state.round}</h2>
                <p className="text-sm text-slate-500 mt-2">{isGod ? "AI 正在行动..." : "处理中..."}</p>
                <div className="flex justify-center gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* death announce */}
          {!isNight && !isGameOver && !isSheriffVote && state.phase !== "SHERIFF_RESULT" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-center">
                {state.nightActions.length > 0 && (() => {
                  const na = state.nightActions[state.nightActions.length - 1];
                  if (!na.actualDeath && !na.poisonTarget) return <p className="text-green-500 font-semibold">✨ 平安夜</p>;
                  const dead: string[] = [];
                  if (na.actualDeath) { const p = state.players.find((pl) => pl.id === na.actualDeath); if (p) dead.push(`${p.name}(${ROLE_INFO[p.role].name})`); }
                  if (na.poisonTarget && na.poisonTarget !== na.actualDeath) { const p = state.players.find((pl) => pl.id === na.poisonTarget); if (p) dead.push(`${p.name}(${ROLE_INFO[p.role].name})`); }
                  return <p className="text-red-500 font-semibold">💀 {dead.join(", ")} 死亡</p>;
                })()}
              </div>
            </div>
          )}

          {/* sheriff vote */}
          {isSheriffVote && mode === "human" && human?.isAlive && human.canVote && (
            <VotePanel players={state.players.filter((p) => p.canVote)} onVote={submitVote} countdown={state.countdownSeconds >= 0 ? state.countdownSeconds : undefined} title="选警长（竞选）" />
          )}

          {/* sheriff result */}
          {state.phase === "SHERIFF_RESULT" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 text-center mb-2">
                ⭐ 警长当选
              </h3>
              {(() => {
                const sheriff = state.players.find((p) => p.isSheriff);
                return sheriff ? (
                  <p className="text-center text-amber-600 dark:text-amber-300 font-bold">{sheriff.name} 当选警长！</p>
                ) : (
                  <p className="text-center text-slate-500">无人当选警长</p>
                );
              })()}
            </div>
          )}

          {/* discussion */}
          {(isDiscuss || isVote || state.phase === "VOTE_RESULT") && (
            <DayDiscussion
              messages={state.chatMessages.filter((m) => m.round === state.round || m.round === state.round - 1)}
              showRoles={isGod} showThinking={isGod} roleLabels={roleLabels}
            />
          )}

          {/* human chat input */}
          {isDiscuss && mode === "human" && human?.isAlive && (
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitChat(); }} placeholder={human?.role === "whiteWolfKing" ? "发言或输入「自爆 玩家名」..." : "发言..."} maxLength={100}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
              <button onClick={submitChat} className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">发言</button>
              {human?.role === "whiteWolfKing" && human.isAlive && !state.whiteWolfKingExploded && (
                <div className="flex gap-2 items-center">
                  <select
                    className="rounded-xl border border-red-300 px-3 py-2 text-sm bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
                    value={humanTarget?.id || ""}
                    onChange={(e) => {
                      const p = state.players.find((p) => p.id === e.target.value);
                      if (p) setHumanTarget(p);
                    }}
                  >
                    <option value="">自爆带走...</option>
                    {state.players.filter((p) => p.isAlive && p.id !== human?.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (humanTarget) submitNightAction({ type: "explode", targetId: humanTarget.id, explode: true });
                    }}
                    disabled={!humanTarget}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200 dark:shadow-red-900/30"
                  >
                    ⚡ 自爆
                  </button>
                </div>
              )}
            </div>
          )}

          {/* vote panel */}
          {isVote && mode === "human" && human?.isAlive && human.canVote && (
            <VotePanel players={state.players} onVote={submitVote} countdown={state.countdownSeconds >= 0 ? state.countdownSeconds : undefined} />
          )}

          {/* hunter pending death action */}
          {mode === "human" && state.pendingHunterId === human?.id && (
            <HunterShootPanel
              state={state} human={human}
              humanTarget={humanTarget} humanTarget2={null}
              onSelectTarget={(p) => setHumanTarget(p)}
              onSelectTarget2={() => {}}
              onSubmit={submitNightAction}
            />
          )}

          {/* vote result */}
          {state.phase === "VOTE_RESULT" && state.votes.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 mb-3">投票结果</h3>
              {(() => {
                const tally = new Map<string, { count: number; voters: string[] }>();
                for (const v of state.votes) {
                  const target = state.players.find((p) => p.id === v.targetId); const name = target?.name || v.targetId;
                  const voter = state.players.find((p) => p.id === v.voterId);
                  const weight = state.players.find((p) => p.id === v.voterId)?.isSheriff ? 2 : 1;
                  if (!tally.has(name)) tally.set(name, { count: 0, voters: [] });
                  tally.get(name)!.count += weight;
                  tally.get(name)!.voters.push(`${voter?.name || v.voterId}${weight > 1 ? "(警长)" : ""}`);
                }
                const entries = [...tally.entries()].sort((a, b) => b[1].count - a[1].count);
                const maxVotes = entries[0]?.[1].count || 0;
                const tie = entries.filter(([, v]) => v.count === maxVotes).length > 1;
                return (
                  <div className="space-y-2">
                    {entries.map(([name, info]) => (
                      <div key={name} className={`flex items-center justify-between p-2 rounded-lg ${info.count === maxVotes && !tie ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-800"}`}>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
                        <span className="text-sm text-slate-500">{info.voters.join(", ")} ({info.count}票)</span>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      {tie ? <span className="text-amber-500 font-semibold">平票 - 无人出局</span> : <span className="text-red-500 font-semibold">{entries[0][0]} 被淘汰</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* god thinking panel */}
          {isGod && Object.keys(thinking).length > 0 && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-950/20">
              <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">AI 思考</h3>
              <div className="space-y-2">
                {Object.entries(thinking).slice(-3).map(([id, text]) => (
                  <div key={id} className="text-xs text-amber-700 dark:text-amber-400"><span className="font-medium">{state.players.find((p) => p.id === id)?.name}: </span><span className="italic">{text}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <NightPhaseOverlay round={state.round} visible={isNight && mode === "human"} />

      {mode === "human" && showRole && human && <RoleReveal player={human} onConfirm={() => setShowRole(false)} />}

      {isGameOver && state.winner && <GameOverModal state={state} onRestart={() => window.location.reload()} onBack={onBack} />}
    </div>
  );
}

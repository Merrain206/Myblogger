"use client";

import { useState } from "react";
import type { GameState, Player, Role } from "@/lib/werewolf/types";
import { ROLE_INFO, WOLF_ROLES } from "@/lib/werewolf/constants";
import PlayerAvatar from "./PlayerAvatar";

interface Props {
  state: GameState;
  human: Player;
  humanTarget: Player | null;
  humanTarget2: Player | null;
  onSelectTarget: (p: Player) => void;
  onSelectTarget2: (p: Player) => void;
  onSubmit: (action: any) => void;
}

function isWolfRole(role: Role): boolean {
  return (WOLF_ROLES as Role[]).includes(role);
}

/** Themed container for night actions */
function ActionCard({
  icon, title, subtitle, colorClass, children,
}: {
  icon: string; title: string; subtitle?: string;
  colorClass: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 ${colorClass} bg-white dark:bg-slate-800/90 overflow-hidden`}>
      <div className={`px-5 py-4 border-b ${colorClass}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Player grid for target selection */
function PlayerGrid({
  players, selectedId, selectedId2, onSelect, disabledIds = [], colorClass,
}: {
  players: Player[]; selectedId: string | null; selectedId2?: string | null;
  onSelect: (p: Player) => void; disabledIds?: string[]; colorClass?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {players.map((p) => {
        const isSelected = p.id === selectedId || p.id === selectedId2;
        const isDisabled = disabledIds.includes(p.id);
        return (
          <div key={p.id} className="relative">
            <PlayerAvatar
              player={p}
              size="lg"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(p)}
            />
            {isSelected && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${colorClass || "bg-primary-500"} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Werewolf Kill Panel ───

function WerewolfKillPanel({ state, human, humanTarget, onSelectTarget, onSubmit }: Props) {
  const partners = state.players.filter((p) => isWolfRole(p.role) && p.id !== human.id);
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id && !isWolfRole(p.role));

  return (
    <ActionCard
      icon="🐺" title="狼人行动" colorClass="border-red-300 dark:border-red-700"
      subtitle={`第${state.round}夜 · 选择击杀目标`}
    >
      {partners.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">🐺 狼同伴</p>
          <div className="flex gap-2">
            {partners.map((p) => (
              <span key={p.id} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                {ROLE_INFO[p.role].icon} {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500 mb-4 text-center">
        优先级：预言家 &gt; 女巫 &gt; 守卫 &gt; 活跃村民
      </p>

      <PlayerGrid
        players={targets}
        selectedId={humanTarget?.id || null}
        onSelect={onSelectTarget}
        colorClass="bg-red-500"
      />

      {humanTarget && (
        <div className="text-center mt-5">
          <button
            onClick={() => onSubmit({ targetId: humanTarget.id, type: "kill" })}
            className="rounded-xl bg-red-500 px-8 py-3 text-sm font-bold text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all hover:-translate-y-0.5"
          >
            🐺 击杀 {humanTarget.name}
          </button>
        </div>
      )}
    </ActionCard>
  );
}

// ─── Seer Check Panel ───

function SeerCheckPanel({ state, human, humanTarget, onSelectTarget, onSubmit }: Props) {
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id);
  const lastNa = state.nightActions[state.nightActions.length - 1];

  return (
    <ActionCard
      icon="🔮" title="预言家查验" colorClass="border-amber-300 dark:border-amber-700"
      subtitle={`第${state.round}夜 · 查验一名玩家身份`}
    >
      {lastNa?.seerCheckTarget && lastNa.seerCheckResult && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            上次查验：<b>{state.players.find((p) => p.id === lastNa.seerCheckTarget)?.name}</b> 是{" "}
            <b>{ROLE_INFO[lastNa.seerCheckResult].icon} {ROLE_INFO[lastNa.seerCheckResult].name}</b>
          </p>
        </div>
      )}

      <p className="text-sm text-slate-500 mb-4 text-center">
        优先查验可疑对象或身份未明的玩家
      </p>

      <PlayerGrid
        players={targets}
        selectedId={humanTarget?.id || null}
        onSelect={onSelectTarget}
        colorClass="bg-amber-500"
      />

      {humanTarget && (
        <div className="text-center mt-5">
          <button
            onClick={() => onSubmit({ targetId: humanTarget.id, type: "check" })}
            className="rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all hover:-translate-y-0.5"
          >
            🔮 查验 {humanTarget.name}
          </button>
        </div>
      )}
    </ActionCard>
  );
}

// ─── Witch Action Panel ───

function WitchActionPanel({ state, human, onSubmit }: Props) {
  const lastNa = state.nightActions[state.nightActions.length - 1];
  const killTarget = lastNa?.killTarget
    ? state.players.find((p) => p.id === lastNa.killTarget)
    : null;
  const [antidoteChoice, setAntidoteChoice] = useState<boolean | null>(null);
  const [poisonTarget, setPoisonTarget] = useState<string | null>(null);

  const handleSubmit = () => {
    onSubmit({
      useAntidote: antidoteChoice === true,
      usePoison: poisonTarget !== null,
      poisonTargetId: poisonTarget,
    });
  };

  const canSubmit = (state.witchHasAntidote ? antidoteChoice !== null : true) &&
    (state.witchHasPoison ? true : true); // poison is optional

  return (
    <ActionCard
      icon="🧙" title="女巫行动" colorClass="border-purple-300 dark:border-purple-700"
      subtitle={`第${state.round}夜 · 解药${state.witchHasAntidote ? "✓" : "✗"} 毒药${state.witchHasPoison ? "✓" : "✗"}`}
    >
      {/* Antidote */}
      {state.witchHasAntidote && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💚</span>
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">解药</p>
              <p className="text-xs text-green-600 dark:text-green-500">
                狼人目标：<b>{killTarget?.name || "?"}</b>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAntidoteChoice(true)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                antidoteChoice === true
                  ? "bg-green-500 text-white shadow-lg shadow-green-200"
                  : "border-2 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30"
              }`}
            >
              💚 救人
            </button>
            <button
              onClick={() => setAntidoteChoice(false)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                antidoteChoice === false
                  ? "bg-slate-400 text-white"
                  : "border-2 border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              不救
            </button>
          </div>
        </div>
      )}

      {!state.witchHasAntidote && (
        <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">💚 解药已使用</p>
        </div>
      )}

      {/* Poison */}
      {state.witchHasPoison && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">☠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">毒药</p>
              <p className="text-xs text-red-600 dark:text-red-500">选择毒杀目标（可选）</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.players.filter((p) => p.isAlive && p.id !== human.id).map((p) => (
              <button
                key={p.id}
                onClick={() => setPoisonTarget(poisonTarget === p.id ? null : p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  poisonTarget === p.id
                    ? "bg-red-500 text-white shadow-lg shadow-red-200"
                    : "border border-red-300 text-red-500 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30"
                }`}
              >
                ☠️ {p.name}
              </button>
            ))}
            <button
              onClick={() => setPoisonTarget(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                poisonTarget === null
                  ? "bg-slate-400 text-white"
                  : "border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              不用毒
            </button>
          </div>
        </div>
      )}

      {!state.witchHasPoison && (
        <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">☠️ 毒药已使用</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={state.witchHasAntidote && antidoteChoice === null}
          className="rounded-xl bg-purple-500 px-8 py-3 text-sm font-bold text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200 dark:shadow-purple-900/30 transition-all hover:-translate-y-0.5"
        >
          🧙 确认
        </button>
      </div>
    </ActionCard>
  );
}

// ─── Guard Protect Panel ───

function GuardProtectPanel({ state, human, humanTarget, onSelectTarget, onSubmit }: Props) {
  const lastGuard = state.nightActions[state.nightActions.length - 1]?.guardTarget;
  const lastGuardPlayer = lastGuard ? state.players.find((p) => p.id === lastGuard) : null;
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id);

  return (
    <ActionCard
      icon="🛡️" title="守卫守护" colorClass="border-cyan-300 dark:border-cyan-700"
      subtitle={`第${state.round}夜 · 守护一名玩家免于狼人攻击`}
    >
      {lastGuardPlayer && (
        <div className="mb-4 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-800">
          <p className="text-xs text-cyan-600 dark:text-cyan-400">
            ⚠️ 昨晚守护了 <b>{lastGuardPlayer.name}</b>，今晚不能重复守护
          </p>
        </div>
      )}

      <p className="text-sm text-slate-500 mb-4 text-center">
        优先守护预言家、女巫等关键角色
      </p>

      <PlayerGrid
        players={targets}
        selectedId={humanTarget?.id || null}
        onSelect={onSelectTarget}
        disabledIds={lastGuard ? [lastGuard] : []}
        colorClass="bg-cyan-500"
      />

      {humanTarget && (
        <div className="text-center mt-5">
          <button
            onClick={() => onSubmit({ targetId: humanTarget.id, type: "guard" })}
            className="rounded-xl bg-cyan-500 px-8 py-3 text-sm font-bold text-white hover:bg-cyan-600 shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30 transition-all hover:-translate-y-0.5"
          >
            🛡️ 守护 {humanTarget.name}
          </button>
        </div>
      )}
    </ActionCard>
  );
}

// ─── Cupid Link Panel ───

function CupidLinkPanel({ state, human, humanTarget, humanTarget2, onSelectTarget, onSelectTarget2, onSubmit }: Props) {
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id);
  const targets1 = targets.filter((p) => p.id !== humanTarget2?.id);
  const targets2 = targets.filter((p) => p.id !== humanTarget?.id);

  return (
    <ActionCard
      icon="💘" title="丘比特连线" colorClass="border-pink-300 dark:border-pink-700"
      subtitle="首夜 · 选择两名玩家成为情侣"
    >
      <p className="text-sm text-slate-500 mb-4 text-center">
        连不同阵营的玩家会增加趣味性。情侣同生共死。
      </p>

      {!humanTarget ? (
        <>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 text-center">
            ✨ 选择第一位玩家：
          </p>
          <PlayerGrid
            players={targets}
            selectedId={null}
            onSelect={onSelectTarget}
            colorClass="bg-pink-400"
          />
        </>
      ) : (
        <>
          <div className="mb-4 p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-800 text-center">
            <span className="text-pink-600 dark:text-pink-400 text-sm">
              已选：<b>{humanTarget.name}</b> 💘 ...
            </span>
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 text-center">
            ✨ 选择第二位玩家：
          </p>
          <PlayerGrid
            players={targets2}
            selectedId={humanTarget2?.id || null}
            onSelect={onSelectTarget2}
            disabledIds={[humanTarget.id]}
            colorClass="bg-pink-400"
          />
        </>
      )}

      {humanTarget && humanTarget2 && (
        <div className="text-center mt-5">
          <button
            onClick={() => onSubmit({ targetId: humanTarget.id, targetId2: humanTarget2.id })}
            className="rounded-xl bg-pink-500 px-8 py-3 text-sm font-bold text-white hover:bg-pink-600 shadow-lg shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:-translate-y-0.5"
          >
            💘 连接 {humanTarget.name} 和 {humanTarget2.name}
          </button>
        </div>
      )}
    </ActionCard>
  );
}

// ─── Wolf Beauty Charm ───

function WolfBeautyCharmPanel({ state, human, humanTarget, onSelectTarget, onSubmit }: Props) {
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id && !isWolfRole(p.role));

  return (
    <ActionCard
      icon="🌹" title="狼美人魅惑" colorClass="border-pink-300 dark:border-pink-700"
      subtitle={`第${state.round}夜 · 魅惑一名玩家`}
    >
      <p className="text-sm text-slate-500 mb-4 text-center">
        被魅惑者若与你一同死亡，则将殉葬。建议选择怀疑的好人特殊角色。
      </p>

      <PlayerGrid
        players={targets}
        selectedId={humanTarget?.id || null}
        onSelect={onSelectTarget}
        colorClass="bg-pink-500"
      />

      {humanTarget && (
        <div className="text-center mt-5">
          <button
            onClick={() => onSubmit({ targetId: humanTarget.id, type: "charm" })}
            className="rounded-xl bg-pink-500 px-8 py-3 text-sm font-bold text-white hover:bg-pink-600 shadow-lg shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:-translate-y-0.5"
          >
            🌹 魅惑 {humanTarget.name}
          </button>
        </div>
      )}
    </ActionCard>
  );
}

// ─── Hunter Shoot Panel ───

function HunterShootPanel({ state, human, humanTarget, onSelectTarget, onSubmit }: Props) {
  const targets = state.players.filter((p) => p.isAlive && p.id !== human.id);

  return (
    <div className="rounded-2xl border-2 border-orange-400 bg-white dark:bg-slate-800/90 overflow-hidden shadow-xl shadow-orange-200 dark:shadow-orange-900/20">
      <div className="px-5 py-4 border-b border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏹</span>
          <div>
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300">猎人临终一击</h3>
            <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">
              你出局了！选择一名玩家带走
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm text-slate-500 mb-4 text-center">
          开枪带走你认为最像狼人的玩家。放弃则点击跳过。
        </p>

        <PlayerGrid
          players={targets}
          selectedId={humanTarget?.id || null}
          onSelect={onSelectTarget}
          colorClass="bg-orange-500"
        />

        <div className="flex gap-3 justify-center mt-5">
          <button
            onClick={() => onSubmit({ type: "shoot", targetId: null })}
            className="rounded-xl border-2 border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            放过
          </button>
          {humanTarget && (
            <button
              onClick={() => onSubmit({ targetId: humanTarget.id, type: "shoot" })}
              className="rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white hover:bg-orange-600 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:-translate-y-0.5"
            >
              🏹 带走 {humanTarget.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exports ───

export default function NightActionPanel(props: Props) {
  const { state, human } = props;
  const actionType = state.expectedHumanAction;

  // Hunter death shoot (not a night action per se, but uses the same system)
  if (actionType === "hunter") return <HunterShootPanel {...props} />;

  switch (actionType) {
    case "cupid":
      return <CupidLinkPanel {...props} />;
    case "guard":
      return <GuardProtectPanel {...props} />;
    case "wbCharm":
      return <WolfBeautyCharmPanel {...props} />;
    case "wolfKill":
      return <WerewolfKillPanel {...props} />;
    case "seer":
      return <SeerCheckPanel {...props} />;
    case "witch":
      return <WitchActionPanel {...props} />;
    default:
      return null;
  }
}

export { HunterShootPanel };

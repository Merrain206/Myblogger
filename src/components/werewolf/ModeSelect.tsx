"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 16;

export default function ModeSelect() {
  const [playerCount, setPlayerCount] = useState(6);
  const router = useRouter();

  const roleDesc = (() => {
    const totalWolves = Math.max(2, Math.floor(playerCount / 3));
    const wwk = playerCount >= 9 ? 1 : 0;
    const wb = playerCount >= 12 ? 1 : 0;
    const ordinary = Math.min(3, Math.max(1, totalWolves - wwk - wb));
    const seers = 1;
    const witches = 1;
    const hunters = playerCount >= 7 ? 1 : 0;
    const guards = playerCount >= 8 ? 1 : 0;
    const cupids = playerCount >= 9 ? 1 : 0;
    const idiots = playerCount >= 10 ? 1 : 0;
    const specialGood = seers + witches + hunters + guards + cupids + idiots;
    const wolves = ordinary + wwk + wb;
    const villagers = Math.min(5, playerCount - wolves - specialGood);
    return { wolves: ordinary, wwk, wb, seers, witches, hunters, guards, cupids, idiots, villagers };
  })();

  const navigate = (mode: string) => {
    router.push(`/werewolf/play?mode=${mode}&players=${playerCount}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">🐺</div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
          AI 狼人杀
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          由 DeepSeek AI 驱动的智能狼人杀，每个 AI 拥有独立的推理和发言
        </p>
      </div>

      {/* Player count selector */}
      <div className="max-w-md mx-auto mb-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            游戏人数
          </span>
          <span className="text-2xl font-bold text-primary-500">{playerCount}</span>
        </div>
        <input
          type="range"
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500 dark:bg-slate-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{MIN_PLAYERS}人</span>
          <span>{MAX_PLAYERS}人</span>
        </div>

        {/* role preview */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          {roleDesc.wolves > 0 && (
            <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
              <div className="text-lg">🐺</div>
              <div className="font-medium text-red-600 dark:text-red-400">狼人×{roleDesc.wolves}</div>
            </div>
          )}
          {roleDesc.wwk > 0 && (
            <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950/30">
              <div className="text-lg">⚡</div>
              <div className="font-medium text-yellow-600 dark:text-yellow-400">白狼王</div>
            </div>
          )}
          {roleDesc.wb > 0 && (
            <div className="rounded-lg bg-pink-50 p-2 dark:bg-pink-950/30">
              <div className="text-lg">🌹</div>
              <div className="font-medium text-pink-600 dark:text-pink-400">狼美人</div>
            </div>
          )}
          <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
            <div className="text-lg">🔮</div>
            <div className="font-medium text-amber-600 dark:text-amber-400">预言家</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
            <div className="text-lg">🧙</div>
            <div className="font-medium text-purple-600 dark:text-purple-400">女巫</div>
          </div>
          {roleDesc.hunters > 0 && (
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-950/30">
              <div className="text-lg">🏹</div>
              <div className="font-medium text-orange-600 dark:text-orange-400">猎人</div>
            </div>
          )}
          {roleDesc.guards > 0 && (
            <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950/30">
              <div className="text-lg">🛡️</div>
              <div className="font-medium text-cyan-600 dark:text-cyan-400">守卫</div>
            </div>
          )}
          {roleDesc.cupids > 0 && (
            <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/30">
              <div className="text-lg">💘</div>
              <div className="font-medium text-rose-600 dark:text-rose-400">丘比特</div>
            </div>
          )}
          {roleDesc.idiots > 0 && (
            <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-950/30">
              <div className="text-lg">🤪</div>
              <div className="font-medium text-teal-600 dark:text-teal-400">白痴</div>
            </div>
          )}
          {roleDesc.villagers > 0 && (
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
              <div className="text-lg">👤</div>
              <div className="font-medium text-green-600 dark:text-green-400">村民×{roleDesc.villagers}</div>
            </div>
          )}
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto mb-12">
        {/* 真人模式 */}
        <button
          onClick={() => navigate("human")}
          className="group rounded-2xl border-2 border-slate-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-primary-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
        >
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            真人模式
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            你随机获得一个身份，与 {playerCount - 1} 位 AI 玩家同台较量。夜晚行动、白天讨论、投票淘汰——体验完整的狼人杀博弈。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-500 group-hover:text-primary-600">
            开始游戏
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5" />
            </svg>
          </div>
        </button>

        {/* 上帝视角 */}
        <button
          onClick={() => navigate("god")}
          className="group rounded-2xl border-2 border-slate-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-amber-600"
        >
          <div className="text-5xl mb-4">👁️</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            上帝视角
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {playerCount} 位 AI 玩家自动对战。你可以看到所有隐藏信息：身份分配、夜晚行动，甚至可以查看每个 AI 的"内心思考"。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-600 group-hover:text-amber-700">
            观看对决
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5" />
            </svg>
          </div>
        </button>
      </div>

      {/* 规则 */}
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          📋 角色配置（{playerCount}人局）
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {roleDesc.wolves > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-red-500">🐺</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">{roleDesc.wolves} 狼人</span>
                <p className="text-slate-500 dark:text-slate-400">夜晚协商击杀目标，白天伪装村民</p>
              </div>
            </div>
          )}
          {roleDesc.wwk > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">⚡</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 白狼王</span>
                <p className="text-slate-500 dark:text-slate-400">白天可自爆带走一人</p>
              </div>
            </div>
          )}
          {roleDesc.wb > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-pink-500">🌹</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 狼美人</span>
                <p className="text-slate-500 dark:text-slate-400">每晚魅惑一人，死亡时被魅惑者殉葬</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-amber-500">🔮</span>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">1 预言家</span>
              <p className="text-slate-500 dark:text-slate-400">每晚查验一名玩家身份</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500">🧙</span>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">1 女巫</span>
              <p className="text-slate-500 dark:text-slate-400">解药救人 + 毒药杀人（各1次）</p>
            </div>
          </div>
          {roleDesc.hunters > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-orange-500">🏹</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 猎人</span>
                <p className="text-slate-500 dark:text-slate-400">出局时开枪带走一人</p>
              </div>
            </div>
          )}
          {roleDesc.guards > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-cyan-500">🛡️</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 守卫</span>
                <p className="text-slate-500 dark:text-slate-400">每晚守护一人，不可连续守护同一人</p>
              </div>
            </div>
          )}
          {roleDesc.cupids > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-rose-500">💘</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 丘比特</span>
                <p className="text-slate-500 dark:text-slate-400">首夜连两人为情侣，同生共死</p>
              </div>
            </div>
          )}
          {roleDesc.idiots > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-teal-500">🤪</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">1 白痴</span>
                <p className="text-slate-500 dark:text-slate-400">被投票出局时亮身份免死，之后不能投票</p>
              </div>
            </div>
          )}
          {roleDesc.villagers > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500">👤</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">{roleDesc.villagers} 村民</span>
                <p className="text-slate-500 dark:text-slate-400">靠推理和投票找出狼人</p>
              </div>
            </div>
          )}
        </div>
        {playerCount > 8 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-yellow-500">⭐</span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">警长（首日竞选）</span>
                <p className="text-slate-500 dark:text-slate-400">投票权重×2，出局时可传警徽</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            胜负条件
          </h4>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <div>🛡️ <b>好人获胜</b>：所有狼人被淘汰</div>
            <div>🐺 <b>狼人获胜</b>：存活狼人数 ≥ 存活好人数</div>
          </div>
        </div>
      </div>
    </div>
  );
}

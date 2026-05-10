"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import type { RootGroup, FlashcardItem } from "@/lib/vocabulary-types";
import { getAllFlashcards } from "@/lib/vocabulary";
import {
  loadProgress,
  saveProgress,
  listUsers,
  createWordProgress,
  updateWordProgress,
  buildStudyQueue,
  getStudyStats,
  type StudyState,
  type StudyStats,
  type WordProgress,
} from "@/lib/study-progress";
import StudyCard from "@/components/vocabulary/StudyCard";

export default function StudyClient({ roots }: { roots: RootGroup[] }) {
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [selectedRoot, setSelectedRoot] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState<"all" | "CET4" | "CET6">("all");
  const [started, setStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [sessionQueue, setSessionQueue] = useState<FlashcardItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, WordProgress>>({});
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState("");

  const existingUsers = useMemo(() => listUsers(), []);

  // 当前筛选下可背诵的卡片
  const eligibleCards = useMemo(() => {
    let cards = getAllFlashcards(selectedRoot === "all" ? undefined : selectedRoot);
    if (selectedLevel !== "all") {
      cards = cards.filter((c) => c.word.level === selectedLevel);
    }
    return cards;
  }, [selectedRoot, selectedLevel]);

  const allCards = useMemo(() => getAllFlashcards(), []);

  const currentCard = sessionQueue[queueIndex] || null;

  const saveCurrentState = useCallback(
    (queue: FlashcardItem[], index: number, map: Record<string, WordProgress>) => {
      if (!username) return;
      const state: StudyState = {
        words: map,
        lastStudyDate: new Date().toISOString().slice(0, 10),
        sessionFilter: { root: selectedRoot, level: selectedLevel },
        sessionQueue: queue.map((c) => c.word.word),
        sessionIndex: index,
      };
      saveProgress(username, state);
    },
    [username, selectedRoot, selectedLevel]
  );

  const handleLogin = useCallback(() => {
    const name = inputName.trim();
    if (!name) return;
    setUsername(name);
    const saved = loadProgress(name);
    if (saved) {
      setProgressMap(saved.words);
      if (saved.sessionFilter) {
        setSelectedRoot(saved.sessionFilter.root || "all");
        setSelectedLevel((saved.sessionFilter.level as "all" | "CET4" | "CET6") || "all");
      }
    }
  }, [inputName]);

  const handleSelectExisting = useCallback((name: string) => {
    setInputName(name);
    setUsername(name);
    const saved = loadProgress(name);
    if (saved) {
      setProgressMap(saved.words);
      if (saved.sessionFilter) {
        setSelectedRoot(saved.sessionFilter.root || "all");
        setSelectedLevel((saved.sessionFilter.level as "all" | "CET4" | "CET6") || "all");
      }
    }
  }, []);

  const handleSwitchUser = useCallback(() => {
    setUsername("");
    setInputName("");
    setStarted(false);
    setSessionQueue([]);
    setQueueIndex(0);
    setProgressMap({});
    setFlipped(false);
  }, []);

  const handleStart = useCallback(
    (resume = false) => {
      let queue: FlashcardItem[];
      let startIndex = 0;

      if (resume) {
        const saved = loadProgress(username);
        if (
          saved?.sessionQueue &&
          saved.sessionQueue.length > 0 &&
          saved.sessionFilter?.root === selectedRoot &&
          saved.sessionFilter?.level === selectedLevel
        ) {
          const savedWordSet = new Set(saved.sessionQueue);
          queue = eligibleCards.filter((c) => savedWordSet.has(c.word.word));
          const savedWord = saved.sessionQueue[saved.sessionIndex];
          if (savedWord) {
            const idx = queue.findIndex((c) => c.word.word === savedWord);
            startIndex = idx >= 0 ? idx : 0;
          }
        } else {
          queue = buildStudyQueue(eligibleCards, progressMap);
        }
      } else {
        queue = buildStudyQueue(eligibleCards, progressMap);
      }

      if (queue.length === 0) {
        setToast("当前筛选下没有需要复习的单词");
        setTimeout(() => setToast(""), 2000);
        return;
      }

      setSessionQueue(queue);
      setQueueIndex(startIndex);
      setFlipped(false);
      setStarted(true);
      setShowStats(false);

      const s = getStudyStats(allCards, progressMap);
      setStats(s);

      saveCurrentState(queue, startIndex, progressMap);
    },
    [eligibleCards, allCards, progressMap, username, selectedRoot, selectedLevel, saveCurrentState]
  );

  const handleRate = useCallback(
    (quality: number) => {
      if (!currentCard) return;

      const word = currentCard.word.word;
      const existing = progressMap[word] || createWordProgress(word);
      const updated = updateWordProgress(existing, quality);
      const newMap = { ...progressMap, [word]: updated };
      setProgressMap(newMap);

      const nextIndex = queueIndex + 1;

      if (nextIndex >= sessionQueue.length) {
        const s = getStudyStats(allCards, newMap);
        setStats(s);
        setShowStats(true);
        setStarted(false);

        const state: StudyState = {
          words: newMap,
          lastStudyDate: new Date().toISOString().slice(0, 10),
          sessionFilter: { root: selectedRoot, level: selectedLevel },
          sessionQueue: [],
          sessionIndex: 0,
        };
        saveProgress(username, state);
      } else {
        setQueueIndex(nextIndex);
        setFlipped(false);
        saveCurrentState(sessionQueue, nextIndex, newMap);
      }
    },
    [currentCard, progressMap, queueIndex, sessionQueue, allCards, username, selectedRoot, selectedLevel, saveCurrentState]
  );

  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  // 键盘快捷键
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)
        return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleFlip();
      }
      if (flipped) {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(3);
        if (e.key === "4") handleRate(5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, flipped, handleFlip, handleRate]);

  // 更新统计
  useEffect(() => {
    if (started) {
      const s = getStudyStats(allCards, progressMap);
      setStats(s);
    }
  }, [progressMap, allCards, started]);

  // —— 登录界面 ——
  if (!username) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          href="/vocabulary"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回词根列表
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">背诵记忆</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            基于间隔重复 · 输入用户名开始背诵，下次回来继续
          </p>
        </div>

        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              你的名字
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="输入用户名..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-900/30"
                autoFocus
              />
              <button
                onClick={handleLogin}
                disabled={!inputName.trim()}
                className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-40"
              >
                开始
              </button>
            </div>

            {existingUsers.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">已有用户，点击直接进入</p>
                <div className="flex flex-wrap gap-1.5">
                  {existingUsers.map((u) => (
                    <button
                      key={u}
                      onClick={() => handleSelectExisting(u)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // —— 完成统计 ——
  if (showStats && stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">本轮完成!</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{username}，继续加油</p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">学习进度</h2>
            <div className="space-y-3">
              <StatRow label="待学习" value={stats.new} color="bg-slate-300 dark:bg-slate-600" />
              <StatRow label="学习中" value={stats.learning} color="bg-orange-400" />
              <StatRow label="复习中" value={stats.reviewing} color="bg-blue-400" />
              <StatRow label="已掌握" value={stats.mastered} color="bg-emerald-400" />
            </div>
            <div className="mt-4 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-primary-500 transition-all"
                style={{
                  width: `${stats.total > 0 ? Math.round(((stats.learning + stats.reviewing + stats.mastered) / stats.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              已接触 {stats.learning + stats.reviewing + stats.mastered} / {stats.total} 个单词
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleStart(false)}
                className="flex-1 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
              >
                再来一轮
              </button>
              <button
                onClick={handleSwitchUser}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                切换用户
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // —— 设置界面（开始前）——
  if (!started) {
    const resumeAvailable = (() => {
      const saved = loadProgress(username);
      return (
        saved?.sessionQueue &&
        saved.sessionQueue.length > 0 &&
        saved.sessionFilter?.root === selectedRoot &&
        saved.sessionFilter?.level === selectedLevel
      );
    })();

    const initStats = getStudyStats(allCards, progressMap);

    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          href="/vocabulary"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回词根列表
        </Link>

        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">背诵记忆</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{username} 的学习记录</p>
          </div>
          <button
            onClick={handleSwitchUser}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            切换用户
          </button>
        </div>

        {/* 全局进度条 */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">总体进度</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {initStats.learning + initStats.reviewing + initStats.mastered} / {initStats.total}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="bg-emerald-400 transition-all"
              style={{ width: `${(initStats.mastered / initStats.total) * 100}%` }}
            />
            <div
              className="bg-blue-400 transition-all"
              style={{ width: `${(initStats.reviewing / initStats.total) * 100}%` }}
            />
            <div
              className="bg-orange-400 transition-all"
              style={{ width: `${(initStats.learning / initStats.total) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> 已掌握 {initStats.mastered}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> 复习中 {initStats.reviewing}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400" /> 学习中 {initStats.learning}
            </span>
            {initStats.due > 0 && (
              <span className="text-amber-500 dark:text-amber-400">待复习 {initStats.due}</span>
            )}
          </div>
        </div>

        {/* 筛选 */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedRoot}
              onChange={(e) => setSelectedRoot(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">全部词根</option>
              {roots.map((g) => (
                <option key={g.root} value={g.root}>
                  {g.root} ({g.words.length}词)
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {(["all", "CET4", "CET6"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedLevel === l
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {l === "all" ? "全部" : l}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              {eligibleCards.length} 词可用
            </span>
          </div>
        </div>

        {/* 开始按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => handleStart(false)}
            className="flex-1 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            开始新背诵
          </button>
          {resumeAvailable && (
            <button
              onClick={() => handleStart(true)}
              className="flex-1 rounded-xl border-2 border-primary-300 bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
            >
              继续上次背诵
            </button>
          )}
        </div>

        {toast && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-center text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // —— 背诵界面 ——
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => {
            setStarted(false);
            setShowStats(true);
          }}
          className="text-sm text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400"
        >
          ← 退出背诵
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">{username}</span>
      </div>

      <div className="mx-auto max-w-md">
        {currentCard ? (
          <>
            <StudyCard
              entry={currentCard.word}
              flipped={flipped}
              rootName={currentCard.root}
              rootMeaning={currentCard.rootMeaning}
              onFlip={handleFlip}
              onRate={handleRate}
            />

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-all"
                  style={{
                    width: `${sessionQueue.length > 0 ? ((queueIndex + 1) / sessionQueue.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                {queueIndex + 1} / {sessionQueue.length}
              </span>
            </div>

            <div className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              空格翻转 · 翻转后按 1-4 评分
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">队列为空</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

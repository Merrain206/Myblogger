"use client";

import type { RootGroup } from "@/lib/vocabulary-types";

export default function FlashCardControls({
  current, total, flipped, randomMode, roots, selectedRoot,
  onFlip, onPrev, onNext, onToggleRandom, onSelectRoot,
}: {
  current: number; total: number; flipped: boolean; randomMode: boolean;
  roots: RootGroup[]; selectedRoot: string;
  onFlip: () => void; onPrev: () => void; onNext: () => void;
  onToggleRandom: () => void; onSelectRoot: (root: string) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${total > 0 ? ((current + 1) / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
          {total > 0 ? current + 1 : 0} / {total}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPrev}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          上一张
        </button>
        <button
          onClick={onFlip}
          className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
        >
          {flipped ? "看正面" : "翻转"}
        </button>
        <button
          onClick={onNext}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          下一张
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onToggleRandom}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            randomMode
              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {randomMode ? "随机模式" : "顺序模式"}
        </button>
        <select
          value={selectedRoot}
          onChange={(e) => onSelectRoot(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="all">全部词根</option>
          {roots.map((g) => (
            <option key={g.root} value={g.root}>
              {g.root} ({g.rootMeaning})
            </option>
          ))}
          <option value="__ungrouped__">独立词汇</option>
        </select>
      </div>
    </div>
  );
}

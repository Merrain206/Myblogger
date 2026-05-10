"use client";

import type { WordEntry } from "@/lib/vocabulary-types";
import WordBreakdown, { type BreakdownPart } from "./WordBreakdown";
import LevelBadge from "./LevelBadge";

function getBreakdownParts(entry: WordEntry): BreakdownPart[] {
  const parts: BreakdownPart[] = [];
  if (entry.prefix)
    parts.push({ text: entry.prefix, meaning: entry.prefixMeaning || "", type: "prefix" });
  if (entry.root)
    parts.push({ text: entry.root, meaning: entry.rootMeaning || "", type: "root" });
  if (entry.suffix)
    parts.push({ text: entry.suffix, meaning: entry.suffixMeaning || "", type: "suffix" });
  return parts;
}

interface RatingOption {
  label: string;
  quality: number;
  color: string;
  desc: string;
}

const ratings: RatingOption[] = [
  { label: "忘记了", quality: 0, color: "bg-red-500 hover:bg-red-600", desc: "完全不记得" },
  { label: "困难", quality: 2, color: "bg-orange-500 hover:bg-orange-600", desc: "有点印象" },
  { label: "一般", quality: 3, color: "bg-blue-500 hover:bg-blue-600", desc: "想起来了" },
  { label: "简单", quality: 5, color: "bg-emerald-500 hover:bg-emerald-600", desc: "很轻松" },
];

export default function StudyCard({
  entry,
  flipped,
  rootName,
  rootMeaning,
  onFlip,
  onRate,
}: {
  entry: WordEntry;
  flipped: boolean;
  rootName?: string;
  rootMeaning?: string;
  onFlip: () => void;
  onRate: (quality: number) => void;
}) {
  const parts = getBreakdownParts(entry);

  return (
    <div className="select-none" style={{ perspective: "1000px" }}>
      <div
        className="relative w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "360px",
          transition: "transform 0.5s",
        }}
      >
        {/* 正面 */}
        <div
          onClick={onFlip}
          className="flex cursor-pointer flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: "hidden", minHeight: "360px" }}
        >
          <LevelBadge level={entry.level} />
          <div className="mt-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100">
            {entry.word}
          </div>
          {entry.phonetic && (
            <div className="mt-3 text-lg text-slate-400 dark:text-slate-500">
              {entry.phonetic}
            </div>
          )}
          {rootName && (
            <div className="mt-4 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              词根: {rootName} ({rootMeaning})
            </div>
          )}
          <div className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            点击翻转查看释义
          </div>
        </div>

        {/* 背面 */}
        <div
          className="absolute inset-0 flex flex-col items-center overflow-auto p-6"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            minHeight: "360px",
          }}
        >
          <LevelBadge level={entry.level} />
          <div className="mt-3 text-2xl font-bold text-primary-600 dark:text-primary-400">
            {entry.word}
          </div>
          <div className="mt-3 max-w-md text-center text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {entry.meaning}
          </div>
          {parts.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-center text-xs text-slate-400 dark:text-slate-500">
                构词分解
              </div>
              <WordBreakdown parts={parts} />
            </div>
          )}

          <div className="mt-auto w-full pt-4">
            <p className="mb-2 text-center text-xs text-slate-400 dark:text-slate-500">
              你的记忆程度？
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ratings.map((r) => (
                <button
                  key={r.quality}
                  onClick={() => onRate(r.quality)}
                  className={`${r.color} rounded-xl px-2 py-2.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95`}
                >
                  <div>{r.label}</div>
                  <div className="mt-0.5 text-[10px] opacity-70">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { WordEntry } from "@/lib/vocabulary-types";
import WordBreakdown, { type BreakdownPart } from "./WordBreakdown";
import LevelBadge from "./LevelBadge";

function getBreakdownParts(entry: WordEntry): BreakdownPart[] {
  const parts: BreakdownPart[] = [];
  if (entry.prefix) {
    parts.push({ text: entry.prefix, meaning: entry.prefixMeaning || "", type: "prefix" });
  }
  if (entry.root) {
    parts.push({ text: entry.root, meaning: entry.rootMeaning || "", type: "root" });
  }
  if (entry.suffix) {
    parts.push({ text: entry.suffix, meaning: entry.suffixMeaning || "", type: "suffix" });
  }
  return parts;
}

export default function WordCard({ entry }: { entry: WordEntry }) {
  const parts = getBreakdownParts(entry);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {entry.word}
        </span>
        <LevelBadge level={entry.level} />
      </div>
      {entry.phonetic && (
        <div className="mb-1.5 text-sm text-slate-400 dark:text-slate-500">
          {entry.phonetic}
        </div>
      )}
      <div className="mb-1.5 text-sm text-slate-600 dark:text-slate-400">
        {entry.meaning}
      </div>
      <WordBreakdown parts={parts} />
    </div>
  );
}

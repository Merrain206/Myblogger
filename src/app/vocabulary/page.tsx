import type { Metadata } from "next";
import { getAllRoots, getUngroupedWords } from "@/lib/vocabulary";
import VocabularyClient from "./VocabularyClient";

export const metadata: Metadata = {
  title: "构词法记单词",
  description: "通过词根词缀法记忆 CET4/CET6 词汇",
};

export default function VocabularyPage() {
  const roots = getAllRoots();
  const ungroupedCount = getUngroupedWords().length;

  const totalWords =
    roots.reduce((s, g) => s + g.words.length, 0) + ungroupedCount;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          构词法记单词
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          通过词根、前缀、后缀分解记忆 · {roots.length} 组词根 · 涵盖 CET4/CET6 共 {totalWords} 词
        </p>
      </div>

      <VocabularyClient roots={roots} ungroupedCount={ungroupedCount} />
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RootGroup } from "@/lib/vocabulary-types";
import { listUsers, loadProgress, type StudyState } from "@/lib/study-progress";
import RootCard from "@/components/vocabulary/RootCard";

export default function VocabularyClient({
  roots,
  ungroupedCount,
}: {
  roots: RootGroup[];
  ungroupedCount: number;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"CET4" | "CET6" | "all">("all");
  const [resumeInfo, setResumeInfo] = useState<{
    username: string;
    state: StudyState;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const users = listUsers();
    for (const u of users) {
      const s = loadProgress(u);
      if (s && s.sessionQueue && s.sessionQueue.length > 0) {
        setResumeInfo({ username: u, state: s });
        break;
      }
    }
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return roots;
    const q = query.toLowerCase().trim();
    return roots.filter((g) => {
      const rootMatch =
        g.root.toLowerCase().includes(q) || g.rootMeaning.includes(q);
      const wordMatch = g.words.some(
        (w) =>
          w.word.toLowerCase().includes(q) || w.meaning.includes(q)
      );
      return rootMatch || wordMatch;
    });
  }, [roots, query]);

  return (
    <div>
      {/* 背诵记忆入口 */}
      <div className="mb-6 rounded-2xl border-2 border-primary-200 bg-primary-50/50 p-5 dark:border-primary-800 dark:bg-primary-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              背诵记忆
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              基于间隔重复 · 科学记忆 · 断点续传
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resumeInfo && (
              <Link
                href="/vocabulary/study"
                className="rounded-xl border-2 border-primary-300 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-700 dark:bg-slate-800 dark:text-primary-300 dark:hover:bg-primary-900/50"
              >
                继续 ({resumeInfo.username}的进度)
              </Link>
            )}
            <Link
              href="/vocabulary/study"
              className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              {resumeInfo ? "开始新背诵" : "开始背诵"}
            </Link>
          </div>
        </div>
      </div>

      {/* 搜索与筛选 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索单词、释义或词根..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-900/30"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "CET4", "CET6"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                level === l
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {l === "all" ? "全部" : l}
            </button>
          ))}
        </div>
      </div>

      {/* 词根网格 */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <RootCard
              key={g.root}
              root={g.root}
              rootMeaning={g.rootMeaning}
              wordCount={g.words.length}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            未找到匹配 &quot;{query}&quot; 的词根或单词
          </p>
        </div>
      )}

      {/* 独立词汇入口 */}
      {!query.trim() && ungroupedCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/vocabulary/__ungrouped__")}
            className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400"
          >
            查看 {ungroupedCount} 个独立词汇（无明显构词法）→
          </button>
        </div>
      )}
    </div>
  );
}

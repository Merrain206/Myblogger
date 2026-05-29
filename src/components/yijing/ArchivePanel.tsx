"use client";

import { useState, useEffect, useCallback } from "react";
import type { PaipanResult, InterpretResult } from "@/lib/yijing/types";

interface ArchiveRecord {
  id: string;
  timestamp: number;
  question: string;
  gender: "男" | "女";
  paipan: PaipanResult;
  interpret: InterpretResult;
}

const STORAGE_KEY = "yijing-archives";

function loadArchives(): ArchiveRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ArchiveRecord[]) : [];
  } catch {
    return [];
  }
}

function saveArchives(records: ArchiveRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage 满时静默失败
  }
}

export default function ArchivePanel({
  paipan,
  interpret,
}: {
  paipan: PaipanResult | null;
  interpret: InterpretResult | null;
}) {
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    setArchives(loadArchives());
  }, []);

  const handleSave = useCallback(() => {
    if (!paipan || !interpret) return;
    const record: ArchiveRecord = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      question: paipan.title,
      gender: paipan.gender,
      paipan,
      interpret,
    };
    const updated = [record, ...archives];
    setArchives(updated);
    saveArchives(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [paipan, interpret, archives]);

  const handleDelete = useCallback((id: string) => {
    const updated = archives.filter((a) => a.id !== id);
    setArchives(updated);
    saveArchives(updated);
    if (viewingId === id) setViewingId(null);
  }, [archives, viewingId]);

  const viewing = archives.find((a) => a.id === viewingId);

  const hasSaved = archives.some(
    (a) => a.question === paipan?.title && a.paipan === paipan
  );

  return (
    <div className="rounded-xl border border-[#D4C5A0]/60 bg-white dark:border-slate-600 dark:bg-slate-800">
      {/* 保存按钮 */}
      {paipan && interpret && (
        <div className="border-b border-[#D4C5A0]/60 px-5 py-3 dark:border-slate-600">
          <button
            type="button"
            onClick={handleSave}
            disabled={!!hasSaved || saved}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-50 text-emerald-600 border border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700"
                : hasSaved
                  ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-700/30 dark:text-slate-500 dark:border-slate-600"
                  : "border border-[#C9A96E] bg-[#FDF8F0] text-[#8B6914] hover:bg-[#C9A96E]/10 dark:border-[#B8956E] dark:bg-slate-800 dark:text-[#C9A96E] dark:hover:bg-[#B8956E]/15"
            }`}
          >
            {saved ? "已保存" : hasSaved ? "已保存过" : "保存结果"}
          </button>
        </div>
      )}

      {/* 存档列表 */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E]">
          历史存档 ({archives.length})
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-[#D4C5A0]/60 px-5 pb-4 dark:border-slate-600">
          {archives.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">暂无存档</p>
          ) : viewing ? (
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => setViewingId(null)}
                className="text-xs text-[#C9A96E] hover:underline"
              >
                ← 返回列表
              </button>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(viewing.timestamp).toLocaleString("zh-CN")}
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {viewing.question}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                本卦：{viewing.paipan.baseHexagram.name}
                {viewing.paipan.changedHexagram && ` → ${viewing.paipan.changedHexagram.name}`}
              </div>
              <div className="prose prose-sm prose-slate max-w-none dark:prose-invert whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {viewing.interpret.synthesis}
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {archives.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600"
                >
                  <button
                    type="button"
                    onClick={() => setViewingId(a.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-xs text-slate-400">
                      {new Date(a.timestamp).toLocaleString("zh-CN")}
                    </div>
                    <div className="text-sm font-medium text-slate-700 truncate dark:text-slate-300">
                      {a.question}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {a.paipan.baseHexagram.name}
                      {a.paipan.changedHexagram && ` → ${a.paipan.changedHexagram.name}`}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                    className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

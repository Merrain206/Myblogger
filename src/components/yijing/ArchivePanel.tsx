"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { PaipanResult, InterpretResult } from "@/lib/yijing/types";

interface ArchiveRecord {
  id: string;
  timestamp: number;
  question: string;
  gender: "男" | "女";
  paipan: PaipanResult;
  interpret: InterpretResult | null;
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

export default function ArchivePanel() {
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    setArchives(loadArchives());
    // 从服务端加载存档，与本地合并去重
    fetch("/api/tools/yijing/archives")
      .then((r) => r.json())
      .then((serverData: ArchiveRecord[]) => {
        if (!Array.isArray(serverData) || serverData.length === 0) return;
        const local = loadArchives();
        const merged = new Map<string, ArchiveRecord>();
        for (const a of [...serverData, ...local]) {
          if (!merged.has(a.id) || a.timestamp > merged.get(a.id)!.timestamp) {
            merged.set(a.id, a);
          }
        }
        const sorted = Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp);
        setArchives(sorted);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted)); } catch {}
      })
      .catch(() => {});
    const onUpdate = () => setArchives(loadArchives());
    window.addEventListener("yijing-archive-updated", onUpdate);
    return () => window.removeEventListener("yijing-archive-updated", onUpdate);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = archives.filter((a) => a.id !== id);
    setArchives(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage 满时静默失败
    }
    // 同步删除服务端（静默降级）
    fetch(`/api/tools/yijing/archives?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    if (viewingId === id) setViewingId(null);
  }, [archives, viewingId]);

  const viewing = archives.find((a) => a.id === viewingId);

  return (
    <div className="rounded-xl border border-[#D4C5A0]/60 bg-white dark:border-slate-600 dark:bg-slate-800">
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
              {viewing.interpret ? (
                <div className="prose prose-sm prose-slate max-w-none dark:prose-invert
                  prose-headings:text-[#8B6914] dark:prose-headings:text-[#C9A96E]
                  prose-a:text-[#C9A96E]
                  prose-strong:text-slate-800 dark:prose-strong:text-slate-200
                  prose-li:marker:text-[#C9A96E]
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {viewing.interpret.synthesis}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-slate-400">未进行 AI 解读</p>
              )}
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

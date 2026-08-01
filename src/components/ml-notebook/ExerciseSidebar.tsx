"use client";

import { useMemo } from "react";
import type { Exercise } from "@/lib/ml-notebook/types";

interface ExerciseSidebarProps {
  exercises: Exercise[];
  selectedId: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onResetAll: () => void;
  onRunAll: () => void;
}

/** 侧栏：课程树 + 练习列表 */
export default function ExerciseSidebar({
  exercises,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
  onResetAll,
  onRunAll,
}: ExerciseSidebarProps) {
  // 按课程分组
  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of exercises) {
      const list = map.get(ex.course) ?? [];
      list.push(ex);
      map.set(ex.course, list);
    }
    return Array.from(map.entries());
  }, [exercises]);

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white pt-16 transition-transform duration-200 dark:border-slate-700 dark:bg-slate-900
          lg:static lg:z-0 lg:translate-x-0 lg:pt-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              📚 课程目录
            </h2>
            <button
              onClick={onToggle}
              className="rounded p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 练习列表 */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {grouped.map(([course, exs]) => (
              <div key={course} className="mb-4">
                <h3 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {course}
                </h3>
                {exs.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSelect(ex.id);
                      // 移动端选择后关闭侧栏
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === ex.id
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-medium">{ex.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      {ex.week}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex gap-2">
              <button
                onClick={onRunAll}
                className="flex-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
              >
                ▶ 全部运行
              </button>
              <button
                onClick={onResetAll}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500"
                title="重置当前练习"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

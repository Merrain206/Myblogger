"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Exercise, CellState, CellOutputItem } from "@/lib/ml-notebook/types";
import { saveNotebook, restoreCellCodes, clearNotebook } from "@/lib/ml-notebook/storage";
import { runPython } from "@/lib/ml-notebook/pyodide";
import CodeCell from "./CodeCell";
import ExerciseSidebar from "./ExerciseSidebar";
import { getAllExercises } from "@/lib/ml-notebook/exercises/registry";

/** 根据 Exercise 初始化 Cell 状态，如有 localStorage 则恢复 */
function initCells(exercise: Exercise): CellState[] {
  const savedCodes = restoreCellCodes(exercise);
  return exercise.cells.map((c) => ({
    id: c.id,
    code: savedCodes.get(c.id) ?? c.initialCode,
    outputs: [],
    status: "idle" as const,
    isModified: savedCodes.has(c.id),
  }));
}

export default function NotebookShell() {
  const exercises = getAllExercises();
  const [selectedId, setSelectedId] = useState(exercises[0]?.id ?? "");
  const [cells, setCells] = useState<CellState[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 切换练习时初始化 cells
  const selectExercise = useCallback((id: string) => {
    const ex = exercises.find((e) => e.id === id);
    if (!ex) return;
    setSelectedId(id);
    setExercise(ex);
    setCells(initCells(ex));
  }, [exercises]);

  // 初始化默认练习
  useEffect(() => {
    if (exercises.length > 0 && !exercise) {
      selectExercise(exercises[0].id);
    }
  }, [exercises, exercise, selectExercise]);

  // 代码变更处理
  const handleCodeChange = useCallback((cellId: string, code: string) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId ? { ...c, code, isModified: true, status: "idle" as const } : c
      )
    );
  }, []);

  // 运行 cell 后更新输出
  const handleCellRun = useCallback((cellId: string, outputs: CellOutputItem[]) => {
    const hasError = outputs.some((o) => o.type === "error");
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? { ...c, outputs, status: hasError ? "error" : "done" }
          : c
      )
    );
  }, []);

  // 重置 cell
  const handleResetCell = useCallback((cellId: string) => {
    if (!exercise) return;
    const orig = exercise.cells.find((c) => c.id === cellId);
    if (!orig) return;
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? { ...c, code: orig.initialCode, outputs: [], status: "idle", isModified: false }
          : c
      )
    );
  }, [exercise]);

  // 添加新 cell
  const handleAddCell = useCallback((afterIndex: number) => {
    const newId = `user-cell-${Date.now()}`;
    const newCell: CellState = {
      id: newId,
      code: "# 在此输入代码\nprint('Hello, ML!')",
      outputs: [],
      status: "idle",
      isModified: true,
    };
    setCells((prev) => {
      const next = [...prev];
      next.splice(afterIndex, 0, newCell);
      return next;
    });
  }, []);

  // 删除 cell
  const handleDeleteCell = useCallback((cellId: string) => {
    setCells((prev) => prev.filter((c) => c.id !== cellId));
  }, []);

  // 运行所有 cell（同步顺序执行）
  const handleRunAll = useCallback(() => {
    setCells((prev) => {
      const next = prev.map((c) => ({ ...c, status: "running" as const, outputs: [] as CellOutputItem[] }));
      // 先更新为 running 状态
      setTimeout(() => {
        setCells((current) => {
          const results = current.map((cell) => {
            try {
              const result = runPython(cell.code);
              const outputs: CellOutputItem[] = [];
              if (result.stdout) outputs.push({ type: "text", content: result.stdout });
              for (const img of result.images) outputs.push({ type: "image", content: img });
              if (result.stderr) outputs.push({ type: "text", content: result.stderr });
              if (result.error) outputs.push({ type: "error", content: result.error });
              return { ...cell, outputs, status: result.error ? ("error" as const) : ("done" as const) };
            } catch (e) {
              return { ...cell, outputs: [{ type: "error" as const, content: String(e) }], status: "error" as const };
            }
          });
          return results;
        });
      }, 50);
      return next;
    });
  }, []);

  // 重置全部
  const handleResetAll = useCallback(() => {
    if (!exercise) return;
    clearNotebook(exercise.id);
    setCells(initCells(exercise));
  }, [exercise]);

  // debounce 自动保存
  useEffect(() => {
    if (!exercise || cells.length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveNotebook(
        exercise.id,
        cells.map((c) => ({ id: c.id, code: c.code, isModified: c.isModified }))
      );
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cells, exercise]);

  if (!exercise) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 侧栏 */}
      <ExerciseSidebar
        exercises={exercises}
        selectedId={selectedId}
        onSelect={selectExercise}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onResetAll={handleResetAll}
        onRunAll={handleRunAll}
      />

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {/* 移动端侧栏切换按钮 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            课程目录
          </button>

          {/* 练习标题 & 说明 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{exercise.course}</span>
              <span>·</span>
              <span>{exercise.week}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {exercise.title}
            </h1>
            {exercise.description && (
              <div className="prose prose-sm mt-3 max-w-none text-slate-600 dark:prose-invert dark:text-slate-400">
                <p>{exercise.description}</p>
              </div>
            )}
          </div>

          {/* Cell 列表 */}
          <div className="space-y-4">
            {cells.map((cell, idx) => (
              <div key={cell.id}>
                {/* Cell 标签（从 exercise 中获取） */}
                {exercise.cells[idx] && (
                  <p className="mb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {exercise.cells[idx].label}
                    {exercise.cells[idx].hint && (
                      <span className="ml-2 text-amber-500">💡 {exercise.cells[idx].hint}</span>
                    )}
                  </p>
                )}
                <CodeCell
                  cell={cell}
                  cellIndex={idx}
                  totalCells={cells.length}
                  onCodeChange={handleCodeChange}
                  onCellRun={handleCellRun}
                  onResetCell={handleResetCell}
                  onAddCell={handleAddCell}
                  onDeleteCell={handleDeleteCell}
                />
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              onClick={() => handleAddCell(cells.length)}
              className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 transition-colors hover:border-primary-400 hover:text-primary-500 dark:border-slate-600 dark:text-slate-400"
            >
              + 添加 Cell
            </button>
            <button
              onClick={handleRunAll}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              ▶ 全部运行
            </button>
            <button
              onClick={handleResetAll}
              className="rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:text-red-500 dark:text-slate-400"
            >
              重置全部
            </button>
          </div>

          {/* 底部空白 */}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}

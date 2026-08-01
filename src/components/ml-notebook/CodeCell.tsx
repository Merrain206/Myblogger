"use client";

import { useState, useCallback } from "react";
import CodeMirrorEditor from "./CodeMirrorEditor";
import CellOutput from "./CellOutput";
import { runPython } from "@/lib/ml-notebook/pyodide";
import type { CellOutputItem, CellState } from "@/lib/ml-notebook/types";

interface CodeCellProps {
  cell: CellState;
  cellIndex: number;
  totalCells: number;
  onCodeChange: (cellId: string, code: string) => void;
  onCellRun: (cellId: string, results: CellOutputItem[]) => void;
  onResetCell: (cellId: string) => void;
  onAddCell: (afterIndex: number) => void;
  onDeleteCell: (cellId: string) => void;
}

/**
 * 单个代码 Cell：编辑器 + 运行按钮 + 输出区域
 */
export default function CodeCell({
  cell,
  cellIndex,
  totalCells,
  onCodeChange,
  onCellRun,
  onResetCell,
  onAddCell,
  onDeleteCell,
}: CodeCellProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);

    try {
      const result = runPython(cell.code);

      const outputs: CellOutputItem[] = [];

      // stdout
      if (result.stdout) {
        outputs.push({ type: "text", content: result.stdout });
      }

      // matplotlib 图表
      for (const img of result.images) {
        outputs.push({ type: "image", content: img });
      }

      // stderr
      if (result.stderr) {
        outputs.push({ type: "text", content: result.stderr });
      }

      // error
      if (result.error) {
        outputs.push({ type: "error", content: result.error });
      }

      onCellRun(cell.id, outputs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      onCellRun(cell.id, [{ type: "error", content: msg }]);
    } finally {
      setRunning(false);
    }
  }, [cell.id, cell.code, onCellRun]);

  const handleReset = useCallback(() => {
    onResetCell(cell.id);
  }, [cell.id, onResetCell]);

  const isRunning = running;
  const hasOutput = cell.outputs.length > 0 || !!error;
  const displayStatus = isRunning ? "running" : cell.status;

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-800">
      {/* Cell 头部：标签 + 操作按钮 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            Cell [{cellIndex + 1}]
          </span>
          {cell.isModified && (
            <span className="text-[10px] text-amber-500">已修改</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {/* 运行 */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1 rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            运行
          </button>

          {/* 重置 */}
          {cell.isModified && (
            <button
              onClick={handleReset}
              className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              title="重置为初始代码"
            >
              重置
            </button>
          )}

          {/* 上方插入 */}
          <button
            onClick={() => onAddCell(cellIndex)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:text-primary-500"
            title="在上方插入新 Cell"
          >
            +上方
          </button>

          {/* 下方插入 */}
          <button
            onClick={() => onAddCell(cellIndex + 1)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:text-primary-500"
            title="在下方插入新 Cell"
          >
            +下方
          </button>

          {/* 删除 */}
          {totalCells > 1 && (
            <button
              onClick={() => onDeleteCell(cell.id)}
              className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:text-red-500"
              title="删除此 Cell"
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/* 代码编辑器 */}
      <CodeMirrorEditor
        value={cell.code}
        onChange={(value) => onCodeChange(cell.id, value)}
        onRun={handleRun}
      />

      {/* 输出区域 */}
      <CellOutput outputs={cell.outputs} status={displayStatus} />
    </div>
  );
}

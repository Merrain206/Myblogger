"use client";

import type { CellOutputItem } from "@/lib/ml-notebook/types";

interface CellOutputProps {
  outputs: CellOutputItem[];
  status: "idle" | "running" | "done" | "error";
}

/** 代码运行输出展示组件 */
export default function CellOutput({ outputs, status }: CellOutputProps) {
  if (status === "running") {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        运行中...
      </div>
    );
  }

  if (outputs.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {outputs.map((item, i) => {
        if (item.type === "image") {
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <img
                src={`data:image/png;base64,${item.content}`}
                alt="图表输出"
                className="max-w-full bg-white"
              />
            </div>
          );
        }

        if (item.type === "error") {
          return (
            <pre
              key={i}
              className="max-h-80 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {item.content}
            </pre>
          );
        }

        // text
        return (
          <pre
            key={i}
            className="max-h-80 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            {item.content || <span className="text-slate-400 italic">(无输出)</span>}
          </pre>
        );
      })}
    </div>
  );
}

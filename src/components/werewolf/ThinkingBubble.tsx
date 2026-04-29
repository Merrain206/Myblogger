"use client";

import { useState } from "react";

export default function ThinkingBubble({
  playerName,
  thinking,
  visible = false,
}: {
  playerName: string;
  thinking: string;
  visible?: boolean;
}) {
  const [expanded, setExpanded] = useState(visible);

  if (!thinking) return null;

  return (
    <div className="flex gap-2 my-1">
      <div className="w-8 flex-shrink-0" />
      <div className="max-w-[80%]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          <span className="italic">💭 {playerName} 的思考过程</span>
        </button>
        {expanded && (
          <div className="mt-1 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 leading-relaxed italic">
            {thinking}
          </div>
        )}
      </div>
    </div>
  );
}

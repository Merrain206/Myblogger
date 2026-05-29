"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InterpretResult } from "@/lib/yijing/types";

export default function AIInterpret({ result }: { result: InterpretResult }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    ...result.perspectives.map((p) => p.name),
    "综合分析",
  ];

  const content = activeTab < result.perspectives.length
    ? result.perspectives[activeTab].content
    : result.synthesis;

  return (
    <div className="rounded-xl border border-[#D4C5A0]/60 bg-white dark:border-slate-600 dark:bg-slate-800">
      <div className="flex border-b border-[#D4C5A0]/60 bg-[#FDF8F0] dark:border-slate-600 dark:bg-slate-800/60">
        {tabs.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-all first:rounded-tl-xl ${
              activeTab === i
                ? "border-b-2 border-[#C9A96E] bg-white text-[#8B6914] dark:border-[#B8956E] dark:bg-slate-800 dark:text-[#C9A96E]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert
          prose-headings:text-[#8B6914] dark:prose-headings:text-[#C9A96E]
          prose-a:text-[#C9A96E] dark:prose-a:text-[#C9A96E]
          prose-strong:text-slate-800 dark:prose-strong:text-slate-200
          prose-li:marker:text-[#C9A96E]
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

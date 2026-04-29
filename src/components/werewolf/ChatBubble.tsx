"use client";

import type { ChatMessage } from "@/lib/werewolf/types";

export default function ChatBubble({
  msg,
  isHuman = false,
  showRole = false,
  roleLabel,
}: {
  msg: ChatMessage;
  isHuman?: boolean;
  showRole?: boolean;
  roleLabel?: string;
}) {
  return (
    <div className={`flex gap-3 ${isHuman ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2
            ${isHuman ? "border-primary-400 bg-primary-50 dark:bg-primary-950" : "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"}`}
        >
          {isHuman ? "😎" : "🤖"}
        </div>
      </div>
      {/* 内容 */}
      <div className={`max-w-[75%] ${isHuman ? "text-right" : ""}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {msg.speakerName}
          </span>
          {showRole && roleLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              {roleLabel}
            </span>
          )}
        </div>
        <div
          className={`rounded-xl px-3 py-2 text-sm leading-relaxed
            ${
              isHuman
                ? "bg-primary-500 text-white rounded-tr-sm"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-tl-sm"
            }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

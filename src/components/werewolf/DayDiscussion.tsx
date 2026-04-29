"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/werewolf/types";
import ChatBubble from "./ChatBubble";
import ThinkingBubble from "./ThinkingBubble";

export default function DayDiscussion({
  messages,
  showRoles = false,
  showThinking = false,
  roleLabels,
}: {
  messages: ChatMessage[];
  showRoles?: boolean;
  showThinking?: boolean;
  roleLabels?: Record<string, string>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
        💬 讨论
      </h3>
      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            等待讨论开始...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.thinking && showThinking && (
              <ThinkingBubble
                playerName={msg.speakerName}
                thinking={msg.thinking}
                visible
              />
            )}
            <ChatBubble
              msg={msg}
              isHuman={false}
              showRole={showRoles}
              roleLabel={roleLabels?.[msg.speakerId]}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

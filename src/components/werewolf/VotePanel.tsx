"use client";

import { useState, useEffect, useRef } from "react";
import type { Player } from "@/lib/werewolf/types";
import PlayerAvatar from "./PlayerAvatar";

export default function VotePanel({
  players,
  onVote,
  countdown,
  title = "投票淘汰",
}: {
  players: Player[];
  onVote: (playerId: string) => void;
  countdown?: number;
  title?: string;
}) {
  const alive = players.filter((p) => p.isAlive);
  const [selected, setSelected] = useState<string | null>(null);
  const votedRef = useRef(false);

  // Auto-submit random vote if countdown hits 0
  useEffect(() => {
    if (countdown === 0 && !votedRef.current && alive.length > 0) {
      votedRef.current = true;
      const randomTarget = alive[Math.floor(Math.random() * alive.length)];
      setSelected(randomTarget.id);
      onVote(randomTarget.id);
    }
  }, [countdown, alive, onVote]);

  const handleVote = (id: string) => {
    if (votedRef.current) return;
    votedRef.current = true;
    setSelected(id);
    onVote(id);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {countdown !== undefined && countdown >= 0 && (
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              countdown <= 5
                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            {countdown}s
          </span>
        )}
      </div>
      {selected ? (
        <div className="text-center py-4">
          <div className="text-primary-500 text-lg">Voted!</div>
          <p className="text-sm text-slate-500 mt-1">Waiting for others...</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 justify-center">
          {alive.map((p) => (
            <PlayerAvatar
              key={p.id}
              player={p}
              onClick={() => handleVote(p.id)}
              size="md"
            />
          ))}
        </div>
      )}
    </div>
  );
}

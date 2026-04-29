"use client";

import type { Player } from "@/lib/werewolf/types";
import PlayerAvatar from "./PlayerAvatar";

export default function PlayerList({
  players,
  showRoles = false,
  loverPairs = [],
  currentSpeakerId,
  onPlayerClick,
  selectable = false,
}: {
  players: Player[];
  showRoles?: boolean;
  loverPairs?: [string, string][];
  currentSpeakerId?: string;
  onPlayerClick?: (player: Player) => void;
  selectable?: boolean;
}) {
  const alive = players.filter((p) => p.isAlive);
  const dead = players.filter((p) => !p.isAlive);

  const isLover = (id: string) => loverPairs.some(([a, b]) => a === id || b === id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
        玩家 ({alive.length}/{players.length})
      </h3>
      <div className="flex flex-wrap gap-3">
        {alive.map((p) => (
          <PlayerAvatar
            key={p.id}
            player={p}
            showRole={showRoles}
            isLover={isLover(p.id)}
            isCurrent={p.id === currentSpeakerId}
            onClick={selectable ? () => onPlayerClick?.(p) : undefined}
            size="sm"
          />
        ))}
        {dead.map((p) => (
          <PlayerAvatar
            key={p.id}
            player={p}
            showRole={showRoles}
            isLover={isLover(p.id)}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RoomSummary } from "@/../server/room-store";

const statusLabels: Record<string, string> = {
  empty: "空闲",
  waiting: "等待对手中...",
  playing: "对局中",
  finished: "对局结束",
};

const statusColors: Record<string, string> = {
  empty: "border-slate-200 dark:border-slate-700",
  waiting: "border-amber-400 dark:border-amber-500",
  playing: "border-emerald-400 dark:border-emerald-500",
  finished: "border-slate-300 dark:border-slate-600",
};

export default function OnlinePage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      try {
        const res = await fetch("/api/gomoku/rooms");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setRooms(data);
          setLoading(false);
        }
      } catch {
        // ws-server 未启动时静默
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">&#x26AB;</div>
          <p className="text-slate-500 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/gomoku"
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ← 返回大厅
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          在线对战
        </h1>
        <div className="w-20" />
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
        选择一个房间，等待另一位玩家加入即可开始对弈
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {rooms.map((room) => {
          const canJoin = room.status === "empty" || room.status === "waiting";
          const isWaiting = room.status === "waiting";
          return (
            <div
              key={room.roomId}
              className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 ${statusColors[room.status]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Room {room.roomId}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    room.status === "playing"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : room.status === "waiting"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {statusLabels[room.status]}
                </span>
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {room.status === "empty" && "暂无玩家，快来加入吧"}
                {room.status === "waiting" && (
                  <>
                    已有 1 位玩家等待中
                    {room.countdown !== null && (
                      <span className="text-amber-500 ml-1">
                        ({room.countdown}s 后解散)
                      </span>
                    )}
                  </>
                )}
                {room.status === "playing" && "正在激烈对弈中..."}
                {room.status === "finished" && "对局已结束"}
              </div>

              <Link
                href={canJoin ? `/gomoku/online/room?room=${room.roomId}` : "#"}
                onClick={(e) => {
                  if (!canJoin) e.preventDefault();
                }}
                className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                  canJoin
                    ? "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                {room.status === "playing" || room.status === "finished"
                  ? "观战中"
                  : isWaiting
                    ? "加入对战"
                    : "进入房间"}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">玩法说明</h3>
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
          <li>· 选择 Room A 或 Room B 进入对战房间</li>
          <li>· 先进房间的为 Guest 1（黑方先手），后进的为 Guest 2（白方）</li>
          <li>· Guest 1 等待 30 秒无对手加入，房间自动解散</li>
          <li>· 对局结束后双方可投票再来一局</li>
        </ul>
      </div>
    </div>
  );
}

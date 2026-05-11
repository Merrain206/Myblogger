"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function RoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (searchParams.get("room") || "A") as "A" | "B";

  const [status, setStatus] = useState<
    "connecting" | "waiting" | "playing" | "finished" | "disbanded"
  >("connecting");
  const [myName, setMyName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{
    winner: string;
    msg: string;
  } | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const myTurnRef = useRef(false);

  const postToIframe = useCallback((msg: object) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, "*");
    }
  }, []);

  // WebSocket 连接
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join-room", roomId }));
    };

    ws.onmessage = (event) => {
      try { handleServerMessage(JSON.parse(event.data)); } catch { /* ignore */ }
    };

    ws.onclose = () => setStatus("disbanded");

    return () => { ws.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 监听 iframe postMessage
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case "gomoku-move": {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "place-piece", row: data.row, col: data.col,
            }));
          }
          myTurnRef.current = false;
          break;
        }
        case "gomoku-request-undo": {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "undo-request" }));
          }
          break;
        }
        case "gomoku-request-rematch": {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "request-rematch" }));
          }
          setRematchRequested(true);
          break;
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleServerMessage(msg: { type: string; [k: string]: unknown }) {
    switch (msg.type) {
      case "room-state": {
        const state = msg.state as {
          status: string;
          players: { name: string; connected: boolean }[];
          yourName: string;
          currentTurn: string;
        };

        if (state.yourName) setMyName(state.yourName);
        const opp = state.players.find(p => p.name !== state.yourName);
        if (opp) setOpponentName(opp.name);

        if (state.status === "waiting") {
          setStatus("waiting");
        } else if (state.status === "playing") {
          setStatus("playing");
          const isMyTurn =
            (state.yourName === "Guest 1" && state.currentTurn === "black") ||
            (state.yourName === "Guest 2" && state.currentTurn === "white");
          myTurnRef.current = isMyTurn;

          postToIframe({
            type: "gomoku-setup",
            role: state.yourName === "Guest 1" ? "guest1" : "guest2",
            roomId,
            isMyTurn,
          });
        }
        break;
      }

      case "countdown":
        setCountdown(msg.seconds as number);
        break;

      case "opponent-move":
        postToIframe({
          type: "gomoku-opponent-move",
          row: msg.row as number,
          col: msg.col as number,
        });
        myTurnRef.current = true;
        break;

      case "game-over": {
        setStatus("finished");
        const winner = msg.winner as string;
        const winCells = msg.winCells as { row: number; col: number }[];
        postToIframe({ type: "gomoku-game-over", winner, winCells });

        if (winner === "draw") {
          setGameResult({ winner: "draw", msg: "握手言和" });
        } else {
          const iWon =
            (myName === "Guest 1" && winner === "black") ||
            (myName === "Guest 2" && winner === "white");
          setGameResult({
            winner: iWon ? "win" : "loss",
            msg: iWon ? "你赢了！" : "对手获胜",
          });
        }
        break;
      }

      case "opponent-left":
        setStatus("finished");
        setGameResult({ winner: "win", msg: "对手离开了房间" });
        postToIframe({ type: "gomoku-opponent-left" });
        break;

      case "room-disbanded":
        setStatus("disbanded");
        postToIframe({ type: "gomoku-room-disbanded" });
        break;

      case "undo-applied": {
        const isMyTurn =
          (myName === "Guest 1" && msg.turn === "black") ||
          (myName === "Guest 2" && msg.turn === "white");
        myTurnRef.current = isMyTurn;
        postToIframe({
          type: "gomoku-undo-applied",
          row: msg.row as number,
          col: msg.col as number,
          turn: msg.turn as string,
        });
        break;
      }

      case "rematch-accepted":
        setStatus("playing");
        setGameResult(null);
        setRematchRequested(false);
        myTurnRef.current = myName === "Guest 1";
        postToIframe({
          type: "gomoku-rematch-start",
          isMyTurn: myName === "Guest 1",
        });
        break;

      case "error":
        console.warn("[WS]", msg.message);
        break;
    }
  }

  function handleRematch() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "request-rematch" }));
    setRematchRequested(true);
  }

  function handleLeave() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave-room" }));
    }
    router.push("/gomoku/online");
  }

  const gameUrl = `/gomoku/index.html?roomId=${roomId}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleLeave}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ← 退出房间
        </button>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Room {roomId}
        </span>
        <div className="w-16" />
      </div>

      {/* 状态标签 */}
      <div className="flex justify-center mb-4">
        {status === "connecting" && (
          <span className="rounded-full bg-slate-100 px-4 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            正在连接服务器...
          </span>
        )}
        {status === "waiting" && (
          <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            等待对手加入... {countdown !== null && `(${countdown}s 后解散)`}
          </span>
        )}
        {status === "playing" && (
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            对局中 · 你 ({myName}) vs 对手 ({opponentName})
          </span>
        )}
        {status === "disbanded" && (
          <span className="rounded-full bg-red-100 px-4 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            房间已解散
          </span>
        )}
      </div>

      {/* 游戏 iframe */}
      <div className="flex justify-center">
        <iframe
          ref={iframeRef}
          src={gameUrl}
          className="rounded-xl border border-slate-200 dark:border-slate-700"
          style={{ width: "100%", maxWidth: "660px", height: "720px" }}
          title="五子棋在线对战"
        />
      </div>

      {/* 结算弹窗 */}
      {gameResult && status === "finished" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 text-center">
            <div className="text-3xl mb-3">
              {gameResult.winner === "win" ? "🏆" : gameResult.winner === "loss" ? "🎯" : "🤝"}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {gameResult.msg}
            </h3>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleLeave}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                退出
              </button>
              <button
                onClick={handleRematch}
                disabled={rematchRequested}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  rematchRequested
                    ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700"
                    : "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25"
                }`}
              >
                {rematchRequested ? "等待对手..." : "再来一局"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解散弹窗 */}
      {status === "disbanded" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 text-center">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              房间已解散
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              等待超时或对手已离开
            </p>
            <button
              onClick={handleLeave}
              className="mt-6 w-full rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              返回大厅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">&#x26AB;</div>
            <p className="text-slate-500 dark:text-slate-400">加载中...</p>
          </div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}

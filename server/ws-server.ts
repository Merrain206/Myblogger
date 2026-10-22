import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { insertScore } from "../src/lib/database";
import {
  rooms, resetRoom, writeSummaries, BOARD_SIZE, EMPTY, BLACK, WHITE,
} from "./room-store";

const PORT = Number(process.env.WS_PORT || 3001);
const DISBAND_SECONDS = 30;
const MAX_PAYLOAD = 32 * 1024;
const MAX_CONNECTIONS_PER_IP = 5;
const MAX_MESSAGES_PER_WINDOW = 30;
const MESSAGE_WINDOW_MS = 10_000;
const IDLE_TIMEOUT_MS = 2 * 60_000;
const HEARTBEAT_MS = 30_000;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join-room"), roomId: z.enum(["A", "B"]) }).strict(),
  z.object({
    type: z.literal("place-piece"),
    row: z.number().int().min(0).max(BOARD_SIZE - 1),
    col: z.number().int().min(0).max(BOARD_SIZE - 1),
  }).strict(),
  z.object({ type: z.literal("request-rematch") }).strict(),
  z.object({ type: z.literal("undo-request") }).strict(),
  z.object({ type: z.literal("undo-response"), accept: z.boolean() }).strict(),
  z.object({ type: z.literal("leave-room") }).strict(),
]);

type ClientMessage = z.infer<typeof clientMessageSchema>;

interface ConnectionState {
  roomId: string | null;
  name: string | null;
  ip: string;
  messageCount: number;
  windowStartedAt: number;
  invalidCount: number;
  lastActivityAt: number;
  alive: boolean;
}

const connectionCounts = new Map<string, number>();
const states = new WeakMap<WebSocket, ConnectionState>();

export function allowedWebSocketOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowed = new Set((process.env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean));
  if (allowed.has(origin)) return true;
  return process.env.NODE_ENV !== "production"
    && (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000");
}

function clientIp(request: IncomingMessage): string {
  const remote = request.socket.remoteAddress || "unknown";
  if (process.env.TRUST_PROXY !== "1") return remote;
  const trusted = new Set((process.env.TRUSTED_PROXY_IPS || "").split(",").map((item) => item.trim()).filter(Boolean));
  if (!trusted.has(remote)) return remote;
  const forwarded = request.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return first && first.length <= 64 ? first : remote;
}

function send(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function fail(ws: WebSocket, message: string) {
  send(ws, { type: "error", message });
}

function checkWinAt(grid: number[][], row: number, col: number, player: number) {
  for (const [dr, dc] of DIRS) {
    const cells = [{ row, col }];
    for (let offset = 1; offset < 5; offset++) {
      const nextRow = row + dr * offset;
      const nextCol = col + dc * offset;
      if (nextRow >= 0 && nextRow < BOARD_SIZE && nextCol >= 0 && nextCol < BOARD_SIZE
        && grid[nextRow][nextCol] === player) cells.push({ row: nextRow, col: nextCol });
      else break;
    }
    for (let offset = 1; offset < 5; offset++) {
      const nextRow = row - dr * offset;
      const nextCol = col - dc * offset;
      if (nextRow >= 0 && nextRow < BOARD_SIZE && nextCol >= 0 && nextCol < BOARD_SIZE
        && grid[nextRow][nextCol] === player) cells.unshift({ row: nextRow, col: nextCol });
      else break;
    }
    if (cells.length >= 5) return cells.slice(0, 5);
  }
  return null;
}

function isBoardFull(grid: number[][]) {
  return grid.every((row) => row.every((cell) => cell !== EMPTY));
}

function buildRoomState(roomId: string, playerName: string | null) {
  const room = rooms.get(roomId)!;
  return {
    roomId,
    status: room.status,
    players: room.players.map((player) => ({ name: player.name, connected: player.ws !== null })),
    yourName: playerName || "",
    currentTurn: room.currentPlayer === BLACK ? "black" as const : "white" as const,
    history: room.history,
    gameOver: room.gameOver,
    winner: room.winner === null ? null : room.winner === BLACK ? "black" as const : "white" as const,
    winCells: room.winCells,
    countdown: room.countdown,
  };
}

function clearRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (room?.disbandTimer) clearInterval(room.disbandTimer);
  resetRoom(roomId);
  writeSummaries();
}

function startDisbandTimer(roomId: string) {
  const room = rooms.get(roomId)!;
  let seconds = DISBAND_SECONDS;
  room.countdown = seconds;
  const timer = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(timer);
      const first = room.players[0];
      if (first?.ws) send(first.ws, { type: "room-disbanded" });
      clearRoom(roomId);
      return;
    }
    room.countdown = seconds;
    writeSummaries();
    if (room.players[0]?.ws) send(room.players[0].ws!, { type: "countdown", seconds });
  }, 1000);
  room.disbandTimer = timer;
}

function persistGame(roomId: string) {
  const room = rooms.get(roomId)!;
  if (!room.gameId || room.players.length !== 2) return;
  const date = new Date().toISOString();
  for (const player of room.players) {
    const playerColor = player.name === "Guest 1" ? BLACK : WHITE;
    const result = room.winner === null ? "draw" : room.winner === playerColor ? "win" : "loss";
    insertScore({
      id: `${room.gameId}-${player.name === "Guest 1" ? "black" : "white"}`,
      playerName: player.name,
      mode: "pvp",
      difficulty: null,
      result,
      moves: room.history.length,
      date,
    }, { gameId: room.gameId, trusted: true });
  }
}

function resetForRematch(roomId: string) {
  const room = rooms.get(roomId)!;
  room.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  room.history = [];
  room.currentPlayer = BLACK;
  room.gameOver = false;
  room.winner = null;
  room.winCells = [];
  room.rematchVotes.clear();
  room.pendingUndoBy = null;
  room.gameId = randomUUID();
  room.status = "playing";
  writeSummaries();
}

function handleMessage(ws: WebSocket, state: ConnectionState, message: ClientMessage) {
  if (message.type === "join-room") {
    if (state.roomId) return fail(ws, "不能重复加入房间");
    const room = rooms.get(message.roomId)!;
    if (room.players.length >= 2) return fail(ws, "房间已满");
    state.roomId = message.roomId;
    state.name = room.players.length === 0 ? "Guest 1" : "Guest 2";
    room.players.push({ name: state.name, ws });
    if (room.players.length === 1) {
      room.status = "waiting";
      startDisbandTimer(message.roomId);
      send(ws, { type: "room-state", state: buildRoomState(message.roomId, state.name) });
      writeSummaries();
    } else {
      if (room.disbandTimer) clearInterval(room.disbandTimer);
      room.disbandTimer = null;
      room.countdown = null;
      room.status = "playing";
      room.gameId = randomUUID();
      writeSummaries();
      for (const player of room.players) {
        if (player.ws) send(player.ws, { type: "room-state", state: buildRoomState(message.roomId, player.name) });
      }
    }
    return;
  }

  if (!state.roomId || !state.name) return fail(ws, "请先加入房间");
  const room = rooms.get(state.roomId)!;

  if (message.type === "place-piece") {
    if (room.status !== "playing" || room.gameOver) return fail(ws, "当前不可落子");
    const player = state.name === "Guest 1" ? BLACK : WHITE;
    if (room.currentPlayer !== player) return fail(ws, "还没轮到你");
    if (room.grid[message.row][message.col] !== EMPTY) return fail(ws, "此处已有棋子");
    room.grid[message.row][message.col] = player;
    room.history.push({ row: message.row, col: message.col, player });
    room.pendingUndoBy = null;
    const winCells = checkWinAt(room.grid, message.row, message.col, player);
    if (winCells || isBoardFull(room.grid)) {
      room.gameOver = true;
      room.winner = winCells ? player : null;
      room.winCells = winCells || [];
      room.status = "finished";
      writeSummaries();
      try { persistGame(state.roomId); } catch { console.error("[ws-server] 排行榜写入失败"); }
      for (const participant of room.players) {
        if (participant.ws) send(participant.ws, {
          type: "game-over",
          winner: winCells ? (player === BLACK ? "black" : "white") : "draw",
          winCells: room.winCells,
        });
      }
    } else {
      room.currentPlayer = player === BLACK ? WHITE : BLACK;
      for (const participant of room.players) {
        if (participant.ws && participant.name !== state.name) {
          send(participant.ws, { type: "opponent-move", row: message.row, col: message.col });
        }
      }
    }
    return;
  }

  if (message.type === "request-rematch") {
    if (room.status !== "finished") return fail(ws, "当前不能重新开始");
    room.rematchVotes.add(state.name);
    if (room.rematchVotes.size === 2) {
      resetForRematch(state.roomId);
      for (const participant of room.players) if (participant.ws) send(participant.ws, { type: "rematch-accepted" });
    }
    return;
  }

  if (message.type === "undo-request") {
    if (room.status !== "playing" || room.gameOver || room.history.length === 0 || room.pendingUndoBy) {
      return fail(ws, "当前不可申请悔棋");
    }
    room.pendingUndoBy = state.name;
    const opponent = room.players.find((player) => player.name !== state.name);
    if (!opponent?.ws) { room.pendingUndoBy = null; return fail(ws, "对手不在线"); }
    send(opponent.ws, { type: "undo-requested" });
    return;
  }

  if (message.type === "undo-response") {
    if (!room.pendingUndoBy || room.pendingUndoBy === state.name) return fail(ws, "没有待确认的悔棋申请");
    if (!message.accept) {
      room.pendingUndoBy = null;
      for (const participant of room.players) if (participant.ws) send(participant.ws, { type: "undo-rejected" });
      return;
    }
    const lastMove = room.history.pop();
    room.pendingUndoBy = null;
    if (!lastMove) return fail(ws, "没有可悔的棋");
    room.grid[lastMove.row][lastMove.col] = EMPTY;
    room.currentPlayer = lastMove.player;
    for (const participant of room.players) if (participant.ws) send(participant.ws, {
      type: "undo-applied",
      row: lastMove.row,
      col: lastMove.col,
      turn: room.currentPlayer === BLACK ? "black" : "white",
    });
    return;
  }

  if (message.type === "leave-room") {
    for (const participant of room.players) {
      if (participant.ws && participant.name !== state.name) send(participant.ws, { type: "opponent-left" });
    }
    clearRoom(state.roomId);
    state.roomId = null;
    state.name = null;
  }
}

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: MAX_PAYLOAD,
  perMessageDeflate: false,
  verifyClient: (info, done) => {
    if (!allowedWebSocketOrigin(info.origin)) return done(false, 403, "Forbidden");
    const ip = clientIp(info.req);
    if ((connectionCounts.get(ip) || 0) >= MAX_CONNECTIONS_PER_IP) return done(false, 429, "Too Many Connections");
    done(true);
  },
});

wss.on("listening", () => {
  writeSummaries();
  console.log(`[ws-server] 已启动，端口 ${PORT}`);
});

wss.on("connection", (ws, request) => {
  const ip = clientIp(request);
  connectionCounts.set(ip, (connectionCounts.get(ip) || 0) + 1);
  const state: ConnectionState = {
    roomId: null,
    name: null,
    ip,
    messageCount: 0,
    windowStartedAt: Date.now(),
    invalidCount: 0,
    lastActivityAt: Date.now(),
    alive: true,
  };
  states.set(ws, state);

  ws.on("error", () => {
    // 协议错误由 ws 负责关闭连接；避免单个恶意连接触发未处理异常终止进程。
  });
  ws.on("pong", () => { state.alive = true; state.lastActivityAt = Date.now(); });
  ws.on("message", (raw, isBinary) => {
    const now = Date.now();
    state.lastActivityAt = now;
    if (now - state.windowStartedAt >= MESSAGE_WINDOW_MS) {
      state.windowStartedAt = now;
      state.messageCount = 0;
    }
    state.messageCount += 1;
    if (state.messageCount > MAX_MESSAGES_PER_WINDOW) return ws.close(1008, "Rate limit exceeded");
    if (isBinary) return ws.close(1003, "Binary messages are not supported");

    try {
      const parsed: unknown = JSON.parse(raw.toString("utf8"));
      const message = clientMessageSchema.safeParse(parsed);
      if (!message.success) {
        state.invalidCount += 1;
        fail(ws, "消息格式无效");
        if (state.invalidCount >= 3) ws.close(1008, "Too many invalid messages");
        return;
      }
      handleMessage(ws, state, message.data);
    } catch {
      state.invalidCount += 1;
      fail(ws, "无效的 JSON");
      if (state.invalidCount >= 3) ws.close(1008, "Too many invalid messages");
    }
  });

  ws.on("close", () => {
    connectionCounts.set(ip, Math.max(0, (connectionCounts.get(ip) || 1) - 1));
    if (!state.roomId || !state.name) return;
    const room = rooms.get(state.roomId);
    if (!room) return;
    for (const participant of room.players) {
      if (participant.ws && participant.name !== state.name) send(participant.ws, { type: "opponent-left" });
    }
    clearRoom(state.roomId);
    state.roomId = null;
    state.name = null;
  });
});

const heartbeat = setInterval(() => {
  const now = Date.now();
  for (const ws of wss.clients) {
    const state = states.get(ws);
    if (!state) continue;
    if (!state.alive || now - state.lastActivityAt > IDLE_TIMEOUT_MS) {
      ws.terminate();
      continue;
    }
    state.alive = false;
    ws.ping();
  }
}, HEARTBEAT_MS);

function shutdown() {
  clearInterval(heartbeat);
  for (const [roomId] of rooms) clearRoom(roomId);
  wss.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

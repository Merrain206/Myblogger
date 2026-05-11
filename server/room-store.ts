// 五子棋在线对战 — 共享状态存储
// 由 ws-server.ts 写入，由 API route 读取

export const BOARD_SIZE = 15;
export const EMPTY = 0, BLACK = 1, WHITE = 2;

export interface RoomState {
  roomId: "A" | "B";
  status: "waiting" | "playing" | "finished";
  players: { name: string; connected: boolean }[];
  currentTurn: "black" | "white" | null;
  history: { row: number; col: number; player: number }[];
  gameOver: boolean;
  winner: "black" | "white" | "draw" | null;
  winCells: { row: number; col: number }[];
  countdown: number | null;
}

export interface RoomSummary {
  roomId: "A" | "B";
  status: "empty" | "waiting" | "playing" | "finished";
  playerCount: number;
  countdown: number | null;
}

export const rooms = new Map<string, {
  status: "empty" | "waiting" | "playing" | "finished";
  players: { name: string; ws: import("ws").WebSocket | null }[];
  grid: number[][];
  currentPlayer: number;
  history: { row: number; col: number; player: number }[];
  gameOver: boolean;
  winner: number | null;
  winCells: { row: number; col: number }[];
  disbandTimer: ReturnType<typeof setTimeout> | null;
  rematchVotes: Set<string>;
  countdown: number | null;
}>();

function initRoom(roomId: "A" | "B") {
  rooms.set(roomId, {
    status: "empty",
    players: [],
    grid: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)),
    currentPlayer: BLACK,
    history: [],
    gameOver: false,
    winner: null,
    winCells: [],
    disbandTimer: null,
    rematchVotes: new Set(),
    countdown: null,
  });
}

initRoom("A");
initRoom("B");

export function getRoomSummary(roomId: string): RoomSummary {
  const room = rooms.get(roomId);
  if (!room) return { roomId: roomId as "A" | "B", status: "empty", playerCount: 0, countdown: null };
  return {
    roomId: roomId as "A" | "B",
    status: room.status,
    playerCount: room.players.length,
    countdown: room.countdown,
  };
}

export function resetRoom(roomId: string) {
  rooms.set(roomId, {
    status: "empty",
    players: [],
    grid: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)),
    currentPlayer: BLACK,
    history: [],
    gameOver: false,
    winner: null,
    winCells: [],
    disbandTimer: null,
    rematchVotes: new Set(),
    countdown: null,
  });
}

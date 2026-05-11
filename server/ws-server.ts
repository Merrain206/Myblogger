// 五子棋在线对战 WebSocket 服务器 — 端口 3001
import { WebSocketServer, WebSocket } from "ws";
import {
  rooms, resetRoom, BOARD_SIZE, EMPTY, BLACK, WHITE,
} from "./room-store";

const PORT = 3001;
const DISBAND_SECONDS = 30;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

// ---- 胜负判定 ----
function checkWinAt(grid: number[][], row: number, col: number, player: number) {
  for (const [dr, dc] of DIRS) {
    const cells = [{ row, col }];
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        cells.push({ row: r, col: c });
      } else break;
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        cells.unshift({ row: r, col: c });
      } else break;
    }
    if (cells.length >= 5) return cells.slice(0, 5);
  }
  return null;
}

function isBoardFull(grid: number[][]) {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (grid[r][c] === EMPTY) return false;
  return true;
}

// ---- 广播 ----
function send(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function buildRoomState(roomId: string, playerName: string | null) {
  const room = rooms.get(roomId)!;
  return {
    roomId,
    status: room.status,
    players: room.players.map(p => ({ name: p.name, connected: p.ws !== null })),
    yourName: playerName || "",
    currentTurn: room.currentPlayer === BLACK ? "black" as const : "white" as const,
    history: room.history,
    gameOver: room.gameOver,
    winner: room.winner === null ? null : room.winner === BLACK ? "black" as const : "white" as const,
    winCells: room.winCells,
    countdown: room.countdown,
  };
}

// ---- 房间清理 ----
function clearRoom(roomId: string) {
  const room = rooms.get(roomId)!;
  if (room.disbandTimer) { clearTimeout(room.disbandTimer); room.disbandTimer = null; }
  resetRoom(roomId);
}

function startDisbandTimer(roomId: string) {
  const room = rooms.get(roomId)!;
  let sec = DISBAND_SECONDS;
  room.countdown = sec;

  const tick = setInterval(() => {
    sec--;
    if (sec <= 0) {
      clearInterval(tick);
      const p = room.players[0];
      if (p && p.ws) send(p.ws, { type: "room-disbanded" });
      clearRoom(roomId);
      console.log(`[Room ${roomId}] 超时解散`);
      return;
    }
    room.countdown = sec;
    if (room.players[0] && room.players[0].ws) {
      send(room.players[0].ws, { type: "countdown", seconds: sec });
    }
  }, 1000);

  room.disbandTimer = tick as unknown as ReturnType<typeof setTimeout>;
}

// ---- 主逻辑 ----
const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
  console.log(`[ws-server] 五子棋 WebSocket 服务器已启动，端口 ${PORT}`);
});

wss.on("connection", (ws: WebSocket) => {
  let myRoomId: string | null = null;
  let myName: string | null = null;

  ws.on("message", (raw) => {
    let msg: { type: string; [k: string]: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "无效的 JSON" });
      return;
    }

    switch (msg.type) {
      case "join-room": {
        const roomId = msg.roomId as string;
        if (roomId !== "A" && roomId !== "B") {
          send(ws, { type: "error", message: "无效的房间号" });
          return;
        }

        const room = rooms.get(roomId)!;

        if (room.players.length >= 2) {
          send(ws, { type: "error", message: "房间已满" });
          return;
        }

        myRoomId = roomId;
        myName = room.players.length === 0 ? "Guest 1" : "Guest 2";
        room.players.push({ name: myName, ws });

        if (room.players.length === 1) {
          room.status = "waiting";
          startDisbandTimer(roomId);
          send(ws, { type: "room-state", state: buildRoomState(roomId, myName) });
          console.log(`[Room ${roomId}] Guest 1 加入，等待对手...`);
        } else {
          if (room.disbandTimer) { clearInterval(room.disbandTimer); room.disbandTimer = null; }
          room.countdown = null;
          room.status = "playing";

          for (const p of room.players) {
            if (p.ws) send(p.ws, { type: "room-state", state: buildRoomState(roomId, p.name) });
          }
          console.log(`[Room ${roomId}] Guest 2 加入，对局开始`);
        }
        break;
      }

      case "place-piece": {
        if (!myRoomId || !myName) return;
        const room = rooms.get(myRoomId)!;
        if (room.status !== "playing" || room.gameOver) {
          send(ws, { type: "error", message: "当前不可落子" });
          return;
        }

        const piecePlayer = myName === "Guest 1" ? BLACK : WHITE;
        if (room.currentPlayer !== piecePlayer) {
          send(ws, { type: "error", message: "还没轮到你" });
          return;
        }

        const row = msg.row as number, col = msg.col as number;
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
          send(ws, { type: "error", message: "越界" });
          return;
        }
        if (room.grid[row][col] !== EMPTY) {
          send(ws, { type: "error", message: "此处已有棋子" });
          return;
        }

        room.grid[row][col] = piecePlayer;
        room.history.push({ row, col, player: piecePlayer });

        const winResult = checkWinAt(room.grid, row, col, piecePlayer);
        if (winResult) {
          room.gameOver = true;
          room.winner = piecePlayer;
          room.winCells = winResult;
          room.status = "finished";

          for (const p of room.players) {
            if (p.ws) {
              const wn = room.winner === BLACK ? "black" : "white";
              send(p.ws, { type: "game-over", winner: wn, winCells: winResult });
            }
          }
        } else if (isBoardFull(room.grid)) {
          room.gameOver = true;
          room.winner = null;
          room.status = "finished";

          for (const p of room.players) {
            if (p.ws) send(p.ws, { type: "game-over", winner: "draw", winCells: [] });
          }
        } else {
          room.currentPlayer = piecePlayer === BLACK ? WHITE : BLACK;

          for (const p of room.players) {
            if (p.ws && p.name !== myName) {
              send(p.ws, { type: "opponent-move", row, col });
            }
          }
        }
        break;
      }

      case "request-rematch": {
        if (!myRoomId || !myName) return;
        const room = rooms.get(myRoomId)!;
        room.rematchVotes.add(myName);

        if (room.rematchVotes.size >= 2) {
          room.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
          room.history = [];
          room.currentPlayer = BLACK;
          room.gameOver = false;
          room.winner = null;
          room.winCells = [];
          room.rematchVotes = new Set();
          room.status = "playing";

          for (const p of room.players) {
            if (p.ws) send(p.ws, { type: "rematch-accepted" });
          }
          console.log(`[Room ${myRoomId}] 再来一局`);
        } else {
          for (const p of room.players) {
            if (p.ws && p.name !== myName) {
              send(p.ws, { type: "room-state", state: buildRoomState(myRoomId!, p.name) });
            }
          }
          send(ws, { type: "room-state", state: buildRoomState(myRoomId, myName) });
        }
        break;
      }

      case "leave-room": {
        if (!myRoomId || !myName) return;
        const room = rooms.get(myRoomId)!;

        for (const p of room.players) {
          if (p.ws && p.name !== myName) send(p.ws, { type: "opponent-left" });
        }

        clearRoom(myRoomId);
        console.log(`[Room ${myRoomId}] ${myName} 离开，房间重置`);
        myRoomId = null;
        myName = null;
        break;
      }

      default:
        send(ws, { type: "error", message: `未知消息类型: ${msg.type}` });
    }
  });

  ws.on("close", () => {
    if (!myRoomId || !myName) return;
    const room = rooms.get(myRoomId);
    if (!room) return;

    const player = room.players.find(p => p.name === myName);
    if (player) player.ws = null;

    for (const p of room.players) {
      if (p.ws && p.name !== myName) send(p.ws, { type: "opponent-left" });
    }

    clearRoom(myRoomId);
    console.log(`[Room ${myRoomId}] ${myName} 断开连接，房间重置`);
  });
});

process.on("SIGINT", () => {
  console.log("\n[ws-server] 正在关闭...");
  for (const [id] of rooms) clearRoom(id);
  wss.close();
  process.exit(0);
});

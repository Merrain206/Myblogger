import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import WebSocket from "ws";

const port = 31991;
const url = `ws://127.0.0.1:${port}`;
const allowedOrigin = "http://localhost:3000";
let server: ChildProcessWithoutNullStreams;
let tempDirectory = "";

function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
  ]);
}

function waitForMessage(ws: WebSocket, type: string): Promise<Record<string, unknown>> {
  return withTimeout(new Promise((resolveMessage) => {
    const listener = (raw: WebSocket.RawData) => {
      const data = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (data.type === type) {
        ws.off("message", listener);
        resolveMessage(data);
      }
    };
    ws.on("message", listener);
  }));
}

function connect(origin = allowedOrigin): Promise<WebSocket> {
  return withTimeout(new Promise((resolveSocket, reject) => {
    const ws = new WebSocket(url, { origin });
    ws.once("open", () => resolveSocket(ws));
    ws.once("error", reject);
  }));
}

test.before(async () => {
  tempDirectory = await mkdtemp(join(tmpdir(), "myblogger-ws-"));
  server = spawn(process.execPath, ["--import", "tsx", "server/ws-server.ts"], {
    cwd: resolve(process.cwd()),
    env: {
      ...process.env,
      WS_PORT: String(port),
      NODE_ENV: "test",
      ALLOWED_ORIGINS: allowedOrigin,
      DATABASE_PATH: join(tempDirectory, "ws.sqlite"),
      TRUST_PROXY: "0",
    },
    stdio: "pipe",
  });
  await withTimeout(new Promise<void>((resolveReady, reject) => {
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("已启动")) resolveReady();
    });
    server.once("exit", (code) => reject(new Error(`WebSocket server exited: ${code}`)));
  }), 10_000);
});

test.after(async () => {
  server.kill();
  await withTimeout(new Promise<void>((resolveExit) => server.once("exit", () => resolveExit())), 5000).catch(() => undefined);
  await rm(tempDirectory, { recursive: true, force: true });
});

test("恶意 Origin 被拒绝", async () => {
  const status = await withTimeout(new Promise<number>((resolveStatus, reject) => {
    const ws = new WebSocket(url, { origin: "https://evil.example" });
    ws.once("unexpected-response", (_request, response) => {
      response.resume();
      resolveStatus(response.statusCode || 0);
    });
    ws.once("open", () => reject(new Error("malicious origin connected")));
    ws.once("error", () => undefined);
  }));
  assert.equal(status, 403);
});

test("超大消息被 maxPayload 拒绝", async () => {
  const ws = await connect();
  const closed = withTimeout(new Promise<number>((resolveCode) => ws.once("close", resolveCode)));
  ws.send(JSON.stringify({ type: "join-room", roomId: "A", padding: "x".repeat(40_000) }));
  assert.equal(await closed, 1009);
});

test("非法坐标与高频消息被断开", async () => {
  const invalid = await connect();
  const invalidClosed = withTimeout(new Promise<number>((resolveCode) => invalid.once("close", resolveCode)));
  for (let index = 0; index < 3; index++) {
    invalid.send(JSON.stringify({ type: "place-piece", row: 1.5, col: 2 }));
  }
  assert.equal(await invalidClosed, 1008);

  const flood = await connect();
  const floodClosed = withTimeout(new Promise<number>((resolveCode) => flood.once("close", resolveCode)));
  for (let index = 0; index < 31; index++) flood.send(JSON.stringify({ type: "leave-room" }));
  assert.equal(await floodClosed, 1008);
});

test("重复 join 被拒绝，断线后房间可重新使用", async () => {
  const first = await connect();
  first.send(JSON.stringify({ type: "join-room", roomId: "A" }));
  await waitForMessage(first, "room-state");
  first.send(JSON.stringify({ type: "join-room", roomId: "B" }));
  const error = await waitForMessage(first, "error");
  assert.equal(error.message, "不能重复加入房间");
  first.close();
  await withTimeout(new Promise<void>((resolveClose) => first.once("close", () => resolveClose())));

  const second = await connect();
  second.send(JSON.stringify({ type: "join-room", roomId: "A" }));
  const state = await waitForMessage(second, "room-state");
  assert.equal((state.state as { status: string }).status, "waiting");
  second.close();
});

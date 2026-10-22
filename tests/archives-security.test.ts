import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AUTH_COOKIE_NAME, createAuthSession } from "../src/lib/auth/route-auth";
import { closeDatabaseForTests } from "../src/lib/database";
import { paipan } from "../src/lib/yijing/paipan";
import { DELETE, GET, POST } from "../src/app/api/tools/yijing/archives/route";
import { configureTestAuth } from "./helpers";

let tempDirectory = "";
let cookie = "";
let csrf = "";

test.before(async () => {
  tempDirectory = await mkdtemp(join(tmpdir(), "myblogger-security-"));
  process.env.DATABASE_PATH = join(tempDirectory, "test.sqlite");
  await configureTestAuth();
  const session = createAuthSession();
  assert.ok(session);
  cookie = `${AUTH_COOKIE_NAME}=${session.token}`;
  csrf = session.csrfToken;
});

test.after(async () => {
  closeDatabaseForTests();
  await rm(tempDirectory, { recursive: true, force: true });
});

function record(id: string) {
  const result = paipan({
    question: "测试问题",
    gender: "男",
    yaoValues: [7, 8, 7, 8, 7, 8],
    province: "浙江",
    city: "杭州",
    dateTime: "2026-10-22T12:00",
  });
  return { id, timestamp: Date.now(), question: "测试问题", gender: "男" as const, paipan: result, interpret: null };
}

function authenticatedRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      cookie,
      origin: "http://localhost:3000",
      "x-csrf-token": csrf,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("archives 未登录 GET/POST/DELETE 均返回 401", async () => {
  assert.equal((await GET(new Request("http://localhost:3000/api/tools/yijing/archives"))).status, 401);
  assert.equal((await POST(new Request("http://localhost:3000/api/tools/yijing/archives", { method: "POST" }))).status, 401);
  assert.equal((await DELETE(new Request("http://localhost:3000/api/tools/yijing/archives?id=abcdef", { method: "DELETE" }))).status, 401);
});

test("已登录状态修改仍要求同源与 CSRF", async () => {
  const withoutCsrf = new Request("http://localhost:3000/api/tools/yijing/archives", {
    method: "POST",
    headers: { cookie, origin: "http://localhost:3000", "content-type": "application/json" },
    body: JSON.stringify(record("csrf_missing")),
  });
  assert.equal((await POST(withoutCsrf)).status, 403);

  const crossOrigin = new Request("http://localhost:3000/api/tools/yijing/archives", {
    method: "POST",
    headers: { cookie, origin: "https://evil.example", "x-csrf-token": csrf, "content-type": "application/json" },
    body: JSON.stringify(record("origin_bad")),
  });
  assert.equal((await POST(crossOrigin)).status, 403);
});

test("合法存档、严格字段、ID 与 no-store", async () => {
  const created = await POST(authenticatedRequest("POST", "http://localhost:3000/api/tools/yijing/archives", record("archive_001")));
  assert.equal(created.status, 201);
  assert.match(created.headers.get("cache-control") || "", /private, no-store/);

  const unknown = { ...record("archive_002"), unexpected: true };
  assert.equal((await POST(authenticatedRequest("POST", "http://localhost:3000/api/tools/yijing/archives", unknown))).status, 400);
  assert.equal((await DELETE(authenticatedRequest("DELETE", "http://localhost:3000/api/tools/yijing/archives?id=../bad"))).status, 400);
});

test("并发写入不会丢数据，删除只影响指定记录", async () => {
  const ids = Array.from({ length: 12 }, (_, index) => `concurrent_${String(index).padStart(2, "0")}`);
  const responses = await Promise.all(ids.map((id) => POST(
    authenticatedRequest("POST", "http://localhost:3000/api/tools/yijing/archives", record(id)),
  )));
  assert.ok(responses.every((response) => response.status === 201));

  const listed = await GET(authenticatedRequest("GET", "http://localhost:3000/api/tools/yijing/archives"));
  const data = await listed.json() as Array<{ id: string }>;
  for (const id of ids) assert.ok(data.some((item) => item.id === id));

  const deleted = await DELETE(authenticatedRequest(
    "DELETE",
    `http://localhost:3000/api/tools/yijing/archives?id=${ids[0]}`,
  ));
  assert.equal(deleted.status, 200);
  const after = await (await GET(authenticatedRequest("GET", "http://localhost:3000/api/tools/yijing/archives"))).json() as Array<{ id: string }>;
  assert.equal(after.some((item) => item.id === ids[0]), false);
  assert.ok(after.some((item) => item.id === ids[1]));
});

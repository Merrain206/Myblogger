import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthSession,
  requireAdmin,
  setSessionCookie,
  validatePassword,
  verifyToken,
} from "../src/lib/auth/route-auth";
import { configureTestAuth } from "./helpers";
import { DELETE as logoutRoute, POST as loginRoute } from "../src/app/api/tools/yijing/auth/route";
import { closeDatabaseForTests } from "../src/lib/database";

let tempDirectory = "";

test.before(async () => {
  tempDirectory = await mkdtemp(join(tmpdir(), "myblogger-auth-"));
  process.env.DATABASE_PATH = join(tempDirectory, "auth.sqlite");
});

test.after(async () => {
  closeDatabaseForTests();
  await rm(tempDirectory, { recursive: true, force: true });
});

test("缺少认证配置时 fail closed", () => {
  delete process.env.AUTH_PASSWORD_HASH;
  delete process.env.AUTH_TOKEN_SECRET;
  assert.equal(createAuthSession(), null);
  const auth = requireAdmin(new Request("http://localhost:3000/api/private"));
  assert.equal(auth.ok, false);
  if (!auth.ok) {
    assert.equal(auth.response.status, 503);
    assert.match(auth.response.headers.get("cache-control") || "", /no-store/);
  }
});

test("scrypt 密码校验与 HttpOnly 会话 Cookie", async () => {
  const password = await configureTestAuth();
  assert.equal(await validatePassword(password), true);
  assert.equal(await validatePassword("wrong password"), false);

  const rawHash = process.env.AUTH_PASSWORD_HASH || "";
  process.env.AUTH_PASSWORD_HASH = rawHash.replaceAll("$", "\\$");
  assert.equal(await validatePassword(password), true);
  process.env.AUTH_PASSWORD_HASH = rawHash;

  const session = createAuthSession();
  assert.ok(session);
  assert.ok(verifyToken(session.token));

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, session.token, session.maxAge);
  const cookie = response.headers.get("set-cookie") || "";
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Path=\//i);
  assert.doesNotMatch(cookie, /Bearer/i);
});

test("旧版固定密钥签发的 token 失效", async () => {
  await configureTestAuth();
  const data = Buffer.from(JSON.stringify({ exp: Date.now() + 86_400_000 }), "utf8").toString("base64url");
  const signature = createHmac("sha256", "retired-public-test-key-not-production").update(data).digest("base64url");
  assert.equal(verifyToken(`${data}.${signature}`), null);
});

test("有效 Cookie 能通过统一管理员鉴权", async () => {
  await configureTestAuth();
  const session = createAuthSession();
  assert.ok(session);
  const request = new Request("http://localhost:3000/api/private", {
    headers: { cookie: `${AUTH_COOKIE_NAME}=${session.token}` },
  });
  assert.equal(requireAdmin(request).ok, true);
});

test("登录响应不返回 Bearer token，生产 Cookie 含 Secure，注销清除 Cookie", async () => {
  const password = await configureTestAuth();
  const previousNodeEnv = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  try {
    const login = await loginRoute(new Request("http://localhost:3000/api/tools/yijing/auth", {
      method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }));
    assert.equal(login.status, 200);
    const loginBody = await login.json() as { valid: boolean; csrfToken: string; token?: string };
    assert.equal(loginBody.valid, true);
    assert.equal(loginBody.token, undefined);
    const setCookie = login.headers.get("set-cookie") || "";
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /HttpOnly/i);

    const sessionCookie = setCookie.split(";")[0];
    const logout = await logoutRoute(new Request("http://localhost:3000/api/tools/yijing/auth", {
      method: "DELETE",
      headers: {
        cookie: sessionCookie,
        origin: "http://localhost:3000",
        "x-csrf-token": loginBody.csrfToken,
      },
    }));
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/i);
    const afterLogout = requireAdmin(new Request("http://localhost:3000/api/private", {
      headers: { cookie: sessionCookie },
    }));
    assert.equal(afterLogout.ok, false);
  } finally {
    Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
  }
});

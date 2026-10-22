import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isSafeMediaName, resolveMediaPath } from "../src/lib/hermes/sync";
import { POST as interpret } from "../src/app/api/tools/yijing/interpret/route";
import { configureTestAuth } from "./helpers";

test("恶意媒体文件名不会进入 Docker 参数或目标目录", () => {
  for (const name of ["../x.png", "x/y.png", "x\\y.png", "-flag.png", "x.png;id", "x\n.png", `${"a".repeat(121)}.png`]) {
    assert.equal(isSafeMediaName(name), false, name);
    assert.equal(resolveMediaPath("C:\\safe\\media", name), null, name);
  }
  assert.equal(isSafeMediaName("safe-name_01.webp"), true);
});

test("未登录 AI 接口不会调用上游", async () => {
  await configureTestAuth();
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { calls += 1; throw new Error("unexpected"); }) as typeof fetch;
  try {
    const response = await interpret(new Request("http://localhost:3000/api/tools/yijing/interpret", { method: "POST" }));
    assert.equal(response.status, 401);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("postMessage 使用同源目标并校验 origin/source", async () => {
  const iframe = await readFile("public/gomoku/index.html", "utf8");
  const parent = await readFile("src/app/gomoku/online/room/page.tsx", "utf8");
  const practice = await readFile("src/app/gomoku/play/page.tsx", "utf8");
  assert.doesNotMatch(iframe, /postMessage\([^\n]+,\s*["']\*["']/);
  assert.doesNotMatch(parent, /postMessage\([^\n]+,\s*["']\*["']/);
  assert.match(iframe, /e\.origin !== window\.location\.origin/);
  assert.match(iframe, /e\.source !== window\.parent/);
  assert.match(parent, /e\.source !== iframeRef\.current\?\.contentWindow/);
  assert.match(practice, /e\.source !== iframeRef\.current\?\.contentWindow/);
});

test("认证源码不再包含旧公开口令和密钥", async () => {
  const auth = await readFile("src/lib/auth/route-auth.ts", "utf8");
  const page = await readFile("src/app/tools/yijing/page.tsx", "utf8");
  assert.doesNotMatch(auth, /CORRECT_PASSWORD|const\s+SECRET\s*=/);
  assert.doesNotMatch(page, /sessionStorage|Bearer|忘记密码/);
});

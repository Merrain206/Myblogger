# Cloudflare 缓存安全操作手册

本文只描述人工操作。应用已将敏感 API 和动态页面标记为 `private, no-store`，Cloudflare 仍必须显式绕过这些请求，不能用“缓存所有内容”覆盖源站策略。

## 规则顺序

按以下优先级建立 Cache Rules，命中后停止继续执行会重新启用缓存的规则：

1. URI Path 以 `/api/` 开头：Cache eligibility 设为 Bypass。
2. 请求 Cookie 包含 `merrain_admin_session`：Bypass。
3. 请求头 `RSC: 1`，或存在 `Next-Router-Prefetch`、`Next-Router-State-Tree`、`Next-Url`：Bypass。若确实需要缓存 RSC，必须建立与 HTML 完全分离的缓存键；当前部署不建议这样做。
4. `/tools/yijing*`、`/tools/hermes*`、`/tools/ticket*`：Bypass。
5. 普通 HTML：Bypass。只缓存带内容哈希的 `/_next/static/*` 等静态资源。

不要缓存 `/api/tools/yijing/auth`、档案、AI 响应、媒体列表或媒体文件。不要忽略源站的 `Set-Cookie`、`Cache-Control: private` 或 `no-store`。

## 发布后清缓存

1. 发布并完成源站检查。
2. Cloudflare → Caching → Configuration → Purge Cache。
3. 安全事件修复首次上线时使用 Purge Everything；后续常规发布可精确清理受影响 URL。
4. 等待各 PoP 生效后，从未登录浏览器重新验证。

## 验证

```bash
curl -sSI https://merrain.cn/api/tools/yijing/archives
curl -sSI -H 'RSC: 1' -H 'Next-Router-Prefetch: 1' https://merrain.cn/
curl -sSI https://merrain.cn/
BASE_URL=https://merrain.cn npm run test:rsc
```

验收条件：未登录档案接口返回 `401` 且含 `private, no-store`；RSC 请求返回 `text/x-component` 后，同 URL 普通请求仍返回 `text/html`；普通 HTML 不含一年期 `s-maxage`；响应不含 `X-Powered-By`。

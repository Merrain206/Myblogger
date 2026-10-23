# Cloudflare 缓存安全操作手册

本文只描述人工操作。应用已将敏感 API 和动态页面标记为 `private, no-store`，Cloudflare 仍必须显式绕过这些请求，不能用“缓存所有内容”覆盖源站策略。

## 首次修复的推荐规则

当前站点由源站为 HTML、RSC 和敏感 API 设置 `private, no-store`，最稳妥的首次修复是只让带内容哈希的 Next.js 构建产物继续参与缓存：

1. Cloudflare → Caching → Cache Rules → Create rule。
2. 规则名填写 `Bypass dynamic and private content`。
3. 选择 Custom filter expression，使用：

   ```text
   not starts_with(http.request.uri.path, "/_next/static/")
   ```

4. Cache eligibility 选择 `Bypass cache`。
5. 将该规则放在所有可能设置 `Eligible for cache` 的规则之后。Cache Rules 会叠加执行；相同设置冲突时，最后一个匹配规则生效。
6. 禁用或删除会对全站执行 Cache Everything、忽略源站 Cache-Control 或强制 Edge TTL 的旧 Cache Rule/Page Rule/Worker 逻辑。

这条保守规则已经覆盖 `/api/*`、认证 Cookie、RSC 请求、管理页面和普通 HTML。若以后确实需要缓存其他静态资源，再逐项放行并回归验证，不要先放宽动态页面。

## 细分规则参考

如果套餐限制或性能需求要求拆分规则，至少覆盖：

1. URI Path 以 `/api/` 开头：Cache eligibility 设为 Bypass。
2. 请求 Cookie 包含 `merrain_admin_session`：Bypass。
3. 请求头 `RSC: 1`，或存在 `Next-Router-Prefetch`、`Next-Router-State-Tree`、`Next-Url`：Bypass。若确实需要缓存 RSC，必须建立与 HTML 完全分离的缓存键；当前部署不建议这样做。
4. `/tools/yijing*`、`/tools/hermes*`、`/tools/ticket*`：Bypass。
5. 普通 HTML：Bypass。只缓存带内容哈希的 `/_next/static/*` 等静态资源。

不要缓存 `/api/tools/yijing/auth`、档案、AI 响应、媒体列表或媒体文件。不要忽略源站的 `Set-Cookie`、`Cache-Control: private` 或 `no-store`。

## 源站证书恢复

如果 Certbot 的 HTTP-01 请求被 Cloudflare 返回 404：

1. 在 DNS 页面暂时把 `merrain.cn` 和 `www` 的代理状态切到 `DNS only`（灰云）；确认 A 记录指向源站，删除或修正无法直达源站的 AAAA 记录。
2. 在源站执行：

   ```bash
   sudo certbot renew --cert-name merrain.cn --no-random-sleep-on-renew
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot certificates
   ```

3. 确认证书未过期且同时包含 `merrain.cn`、`www.merrain.cn`，再把两个 DNS 记录恢复为 Proxied（橙云）。
4. Cloudflare → SSL/TLS → Overview 选择 `Full (strict)`。在源站证书有效前不要提前切换，否则会返回 526。
5. SSL/TLS → Edge Certificates 开启 Always Use HTTPS。
6. 所有 HTTPS 和子域验证完成后再启用 HSTS；首次使用较短 `max-age`，暂不勾选 `includeSubDomains` 和 preload。

## Tunnel 路由检查

Cloudflare Tunnel 的 `path` 使用正则匹配。所有前缀路由都应同时锚定开头和结尾，例如 `^/ncm(/.*)?$`、`^/hermes(/.*)?$`；精确路由使用 `^/ws$`。修改后先执行：

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml ingress validate
```

再重启 `cloudflared`，并分别验证公开路由和同名前缀的应用 API。不要使用未锚定的 `/hermes`，否则它也会匹配 `/api/hermes/*`。

删除服务后也要同步删除对应 ingress；不要把不存在的 `/hermes`、`/taichi` 等前缀继续指向会跳回同一 HTTPS URL 的 Nginx HTTP 重定向，否则会形成自重定向循环。

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

# 安全部署手册

## 运行时与密钥

1. 使用 Node.js 22.5 或更高版本；当前 SQLite 实现使用 Node 内置 `node:sqlite`。建议生产固定到 Node 24 LTS 并在升级时重跑全部测试。
2. 运行 `npm run auth:generate`，将输出写入服务器的密钥管理或 PM2 环境，不要写入仓库、工单或聊天记录。
3. 配置 `.env.example` 中的必需变量。生产至少需要 `AUTH_PASSWORD_HASH`、`AUTH_TOKEN_SECRET`、`ALLOWED_ORIGINS`、`DATABASE_PATH` 和 `DEEPSEEK_API_KEY`。
4. `AUTH_TOKEN_SECRET` 必须是至少 32 字节的密码学随机值。每次轮换都会令旧 Cookie 立即失效。
5. 数据库和 Hermes 私有媒体目录只授予 Web 服务账户读写权限，不放在 `public/` 下。

## 数据迁移

先停止写入，再设置 `DATABASE_PATH` 并执行：

```bash
npm run db:migrate
```

该命令会通过 Node 的 `--env-file=.env.local` 显式加载数据库路径。脚本会先在原 JSON 旁创建带时间戳的备份，再幂等插入 SQLite；不会删除或覆盖原 JSON。核对记录数并备份数据库后，才可人工归档旧 JSON。SQLite 已启用 WAL、事务、唯一约束和 busy timeout。

## Nginx、HTTPS 与 HSTS

1. 审查并部署 `server/nginx-myblogger.conf`。
2. Cloudflare 开启 Always Use HTTPS；源站 80 端口保持永久跳转。
3. 验证：

```bash
curl -sSI http://merrain.cn/ | head
curl -sSI https://merrain.cn/ | head
```

HTTP 必须返回 `301` 或 `308`，HTTPS 才能返回 `200`。确认所有相关子域、证书、回源和重定向均正常后，再人工启用 HSTS。首次建议短 `max-age`；验证稳定后逐步提高，最后才考虑 `includeSubDomains` 与 preload。

## Docker 同步最小权限

应用不再调用 shell，也不再使用 `sudo docker`。不要给 Web 服务用户通用 sudo 或 Docker 管理权限，因为 Docker 权限等价于主机 root。推荐使用一个只允许“列出指定目录并复制白名单文件”的独立同步服务或受限 Unix socket 代理，并让本应用调用该服务。

## CSP 上线步骤

当前先发送 `Content-Security-Policy-Report-Only`，因为站点包含 Next.js hydration、同源五子棋 iframe 和 Giscus。观察报告并消除合法资源阻断后，为每个请求注入 nonce，给 Next.js 脚本传递同一 nonce，再将头切换为强制 `Content-Security-Policy`。不要用长期 `unsafe-eval` 作为替代方案。

## 发布检查

```bash
npm ci
npm audit --omit=dev
npm run typecheck
npm run lint
npm test
npm run build
```

发布后执行 Cloudflare 手册中的缓存清理与 RSC 回归。生产 Nginx 是唯一可信代理时才设置 `TRUST_PROXY=1`，并为 WebSocket 配置精确的 `TRUSTED_PROXY_IPS`。

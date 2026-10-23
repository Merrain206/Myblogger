# 安全部署手册

## 运行时与密钥

1. 使用 Node.js 22.5 或更高版本；当前 SQLite 实现使用 Node 内置 `node:sqlite`。建议生产固定到 Node 24 LTS 并在升级时重跑全部测试。
2. 运行 `npm run auth:generate`，将输出写入服务器的 `.env.local` 或密钥管理，不要写入仓库、工单或聊天记录。生成的哈希已对 dotenv 的 `$` 展开做转义，认证读取端也兼容直接注入环境变量。
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

## 主机与隧道基线

1. UFW 默认拒绝入站，只开放密钥认证的 SSH；Next、Nginx、WebSocket、NCM 和容器服务均绑定 `127.0.0.1`，通过 Cloudflare Tunnel 回源，不直接开放公网端口。
2. SSH 禁用 root、密码、键盘交互、X11、Agent 转发和 Tunnel，并启用 Fail2ban `sshd` jail。修改后先运行 `sshd -t`，保持现有会话并用新会话验证成功后再退出。
3. Tunnel 的路径正则必须完整锚定，例如 `^/hermes(/.*)?$`；未经锚定的 `/hermes` 会误匹配 `/api/hermes/*` 并产生回源错误或重定向循环。
4. Docker 发布端口显式绑定 `127.0.0.1`。部署机使用 Docker Compose v2；不要使用已停止维护的 Compose v1 重建容器。
5. `unattended-upgrades` 必须允许 `${distro_id}:${distro_codename}-security`，自动重启保持关闭，由维护窗口人工重启并验证服务。
6. 不运行 telnet/inetd；NCM 等非特权端口服务使用 `ubuntu` 账户和固定的 Node 24，不使用 root PM2。
7. 云厂商精确 pin 的 `cloud-init` 不得自行取消固定。先向云厂商确认其自定义数据源在目标官方版本中受支持，再安排带控制台回滚能力的维护窗口。

## Docker 同步最小权限

应用不再调用 shell，也不直接使用 `sudo docker`。不要给 Web 服务用户通用 sudo 或 Docker 管理权限，因为 Docker 权限等价于主机 root。仓库提供了只允许“列出固定容器目录并复制白名单图片到固定私有目录”的生产桥：

```bash
sudo install -o root -g root -m 0755 server/hermes-docker-bridge /usr/local/sbin/myblogger-hermes-docker
sudo install -d -o root -g root -m 0755 /usr/local/libexec/myblogger
sudo install -o root -g root -m 0755 server/hermes-docker-wrapper /usr/local/libexec/myblogger/docker
sudo visudo -cf server/hermes-docker-bridge.sudoers
sudo install -o root -g root -m 0440 server/hermes-docker-bridge.sudoers /etc/sudoers.d/myblogger-hermes-docker
sudo chown root:ubuntu /home/ubuntu/myblogger-data/hermes
sudo chmod 0750 /home/ubuntu/myblogger-data/hermes
```

启动 Web 进程时，将 `/usr/local/libexec/myblogger` 放在 `PATH` 最前。桥脚本为 root 所有并再次校验参数、容器名、源目录、目标目录和文件名；sudoers 只允许调用该脚本。部署后应确认任意其他 Docker 参数返回拒绝，并通过已认证的 `/api/hermes/sync` 做一次回归。

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

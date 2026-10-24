# 安全修复报告

日期：2026-10-23

## 结论

仓库内可执行的高风险修复已经完成并通过自动化验证。生产依赖 `npm audit --omit=dev` 为 0 漏洞；17 项安全测试、TypeScript、lint、Next.js 生产构建与 RSC/HTML 缓存隔离回归均通过。

修复版本已部署到生产源站；管理员密码与会话签名密钥已重新生成，JSON 已迁移到 SQLite，Nginx 与最小权限 Docker 桥已上线。Cloudflare 缓存规则、源站证书、隧道路由和公网端口均已完成加固；仓库已设为私有。Git 分支历史已改写并通过扫描，但 GitHub 仍能按旧 SHA 返回不可达对象，必须由 GitHub Support 完成服务端清除后才能公开。HSTS 和 DeepSeek 平台密钥轮换仍需按下文条件处理。

## 漏洞修复与验证

### 认证、授权与缓存

- 删除源码中的固定密码、固定 HMAC 密钥和密码提示。
- 密码使用 scrypt 哈希验证并进行 timing-safe 比较；密钥和 TTL 只从环境变量读取，缺失时 fail closed。
- Bearer/sessionStorage 改为服务端签名的 HttpOnly、SameSite=Strict、Path=/ Cookie；生产 Cookie 带 Secure。
- 会话记录存入 SQLite；注销会撤销 jti 并清除 Cookie，旧版或未登记 token 无效。
- 增加登录 IP/账户限流、登录/状态/注销接口、统一 `requireAdmin`、Origin 与会话绑定 CSRF 校验。
- archives、AI、sync、Hermes 媒体列表与文件全部为 admin-only、force-dynamic、private/no-store。
- 测试覆盖未登录 401、CSRF/跨域 403、Cookie 属性、注销撤销、旧 token 失效和 no-store。

### 档案、成绩与持久化

- 档案和成绩从覆盖式 JSON 改为 SQLite，启用 WAL、事务、busy timeout、主键和唯一约束。
- archives 使用严格 Zod schema、ID 白名单、大小/深度限制和不含正文的审计日志。
- 提供幂等迁移脚本；迁移前复制备份，失败不删除原 JSON。
- 浏览器 PvAI 结果不再提交可信榜；在线成绩只由 WebSocket 服务端根据真实棋局写入。
- 测试覆盖合法增删查、未知字段、非法 ID 和 12 路并发写入不丢记录。

### AI 成本与隐私

- ticket/parse 与 yijing/interpret 先鉴权再解析或调用上游；未登录不会触发付费请求。
- 增加 IP/账户限流、SQLite 每日次数/token/估算费用配额、全局并发、AbortController 超时、一次重试和熔断。
- 请求体、JSON 深度、问题/OCR 长度及上游结构均严格校验；不再记录模型原文、身份信息、文件路径或上游错误正文。
- 前端明确提示内容会发送给第三方 DeepSeek 服务。

### RSC、依赖与响应头

- Next.js 升至 16.4.2，React/React DOM 19.3.1，ws 8.22.0，next-mdx-remote 6.0.0。
- 删除未使用的 pdfjs-dist；删除 gray-matter/旧 js-yaml 链；更新 DOMPurify、PostCSS、source-map-js；KaTeX 固定为 0.18.2。
- 关闭 X-Powered-By；增加 nosniff、SAMEORIGIN、Referrer Policy、Permissions Policy 和 CSP Report-Only。
- Proxy 与 Nginx 对 API、动态 HTML、RSC 设置 no-store 和正确 Vary；静态哈希资源保留长缓存。
- 实测先 RSC 后 HTML：前者为 text/x-component，后者仍为 text/html 且 private/no-store。

### 命令、WebSocket 与 postMessage

- 媒体同步由 shell `exec` 改为 `execFile` 参数数组、`shell: false`、固定 Docker 命令、文件名白名单与 resolve 后目录约束。
- Hermes 文件移出 public 目录，通过鉴权 API 提供；SVG 响应带 sandbox CSP。
- WebSocket 增加 Origin、32 KiB maxPayload、每 IP 连接上限、消息限流、空闲超时、ping/pong、异常消息断开和严格 schema。
- 坐标必须为有限整数；重复 join 被拒绝；断线/计时器清理；悔棋改为对手确认。
- iframe 通信使用同源 targetOrigin，并同时校验 origin、source、type、字段和坐标。
- 测试覆盖恶意 Origin、超大包、高频/非法消息、重复 join、断线复用、恶意文件名和伪造 postMessage 防护。

### 个人信息与历史

- 19 份被 Git 跟踪的票据 PDF 已从索引移除，本地文件保留并由 `.gitignore` 忽略。
- 旧 `src/data/gomoku-scores.json` 已从索引移除，本地文件保留供迁移。
- `.gitignore` 新增票据、OCR、私有 JSON、数据库、WAL、备份和所有 `.env*`（保留 `.env.example`）。
- 当前被跟踪树的秘密扫描未发现命中；两处 18 位数字正则命中均不含有效日期，判定为非身份证号格式。
- 已改写全部历史：删除 19 份票据 PDF、旧比分 JSON 和一份 52.12 MiB 的旧 PPTX，并替换旧固定密码与固定 HMAC 密钥；改写后的路径、原值和 Gitleaks 扫描均为 0 命中，历史中已无大于等于 5 MiB 的 blob。
- GitHub `main` 已强制更新且全新 clone 验证通过；旧提交仍可按 SHA 获取，平台侧清除步骤见 `docs/git-history-cleanup.md`。

## 验证命令与结果

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，0 error；保留 13 个既有非阻断 warning |
| `npm test` | 17/17 通过 |
| `npm run build` | Next.js 16.4.2 生产构建通过 |
| `npm run test:rsc` | 源站 RSC/HTML 隔离与 HTML no-store 通过；Cloudflare 公网因旧缓存规则仍失败 |
| `npm audit --json` / `npm audit --omit=dev --json` | 全量与生产依赖均为 0 vulnerabilities |
| `git diff --check` | 通过；仅有 Windows 行尾提示 |
| Gitleaks 完整历史扫描 | 全部可达提交，0 命中 |
| 改写对象检查 | 21 个旧私密或大型文件对象均不可达；旧密码和 HMAC 原值均为 0 次残留 |

## 修改文件

- 认证与安全基础：`.env.example`、`.gitignore`、`src/lib/auth/route-auth.ts`、`src/lib/auth/use-admin-session.ts`、`src/lib/security/*`、`src/proxy.ts`。
- 数据与 schema：`src/lib/database.ts`、`src/lib/yijing/schemas.ts`、`src/lib/ticket/schema.ts`、`scripts/migrate-json-to-sqlite.ts`。
- API：`src/app/api/tools/**`、`src/app/api/sync-media/route.ts`、`src/app/api/hermes/**`、`src/app/api/media/route.ts`、`src/app/api/gomoku/score/route.ts`。
- WebSocket/浏览器：`server/ws-server.ts`、`server/room-store.ts`、`server/nginx-myblogger.conf`、`public/gomoku/index.html`、五子棋与三个管理工具页面、`ArchivePanel.tsx`。
- 框架与依赖：`package.json`、`package-lock.json`、`next.config.ts`、`eslint.config.mjs`、`tsconfig.json`、`src/app/layout.tsx`、`src/lib/posts.ts`、`README.md`。
- 测试与脚本：`tests/*`、`scripts/check-rsc-cache.mjs`、`scripts/generate-auth-config.ts`。
- 运维文档：`docs/cloudflare-security-runbook.md`、`docs/deployment-security.md`、`docs/git-history-cleanup.md`、`docs/security-incident-response.md`、`docs/npm-audit-summary.md`、`public/.well-known/security.txt`。
- 最小权限同步桥：`server/hermes-docker-bridge`、`server/hermes-docker-wrapper`、`server/hermes-docker-bridge.sudoers`。
- 索引删除：`Tickets/pdfs/*.pdf`（19 份）和 `src/data/gomoku-scores.json`。

本地 PDF、数据库文件以及 `.playwright-mcp/`、`src/.claude/`、`src/pictures/` 内容未被修改；这些本地工具或素材目录现已加入 `.gitignore`。`.claude/settings.local.json` 已从 Git 索引移除，但本地文件保留并被忽略。

## 生产部署结果

- 生产运行时固定到用户级 Node.js 24.22.1 LTS；系统 Node 未替换。PM2 的 Web 与 WebSocket 进程均在线并已保存自启动快照。
- 生产环境变量文件权限为 600；数据库与 Hermes 媒体位于代码目录之外。迁移导入 4 条档案、10 条历史练习成绩，原 JSON 和部署前备份均保留。
- 源站 HTTP 返回 301，HTTPS HTML 返回 `private, no-store`，敏感 API 未登录返回 401，CSP Report-Only 生效且不含 `X-Powered-By`。
- Hermes 桥只允许固定容器目录的 `find` 和白名单图片 `cp`；任意 Docker 命令被拒绝。真实登录、CSRF、同步、注销链路通过。
- 生产依赖审计为 0 漏洞；Linux 上 17/17 测试、类型检查、lint（0 error、13 warning）和生产构建通过。
- 部署前完整备份与上一版本目录均保留，可用于回滚。
- Cloudflare 已使用保守缓存绕过规则并完成清缓存；线上 RSC/HTML 隔离回归通过，敏感 API 返回 `401`、`private, no-store` 和动态缓存状态。
- `merrain.cn`/`www.merrain.cn` 源站证书已通过 DNS-01 续期至 2027-01-20，自动续期 dry-run 通过，Cloudflare 为 Full (strict)、Always Use HTTPS、最低 TLS 1.2。
- Cloudflare Tunnel 的路径规则已改为完整锚定，避免 `/api/hermes/*` 被 `/hermes` 规则误匹配；Hermes API 不再发生重定向循环。
- 已移除失效且产生自重定向的 `/taichi`、`/hermes` Tunnel 入口；Hermes 只保留正式的 `/tools/hermes` 和鉴权 API。
- UFW 默认拒绝入站，仅开放 SSH 22；Nginx、Next、WebSocket、NCM、Hermes 和辅助端口均只绑定回环地址，由 Cloudflare Tunnel 回源。
- SSH 已禁用 root、密码、键盘交互、X11、Agent 转发和 Tunnel，仅允许密钥认证；Fail2ban 的 `sshd` jail 已启用并采用递增封禁。
- Hermes 容器使用 Docker Compose v2，所有 `8642`、`9000-9050` 端口只绑定 `127.0.0.1`。
- NCM 已从 root PM2 迁移到 `ubuntu` 账户运行，空闲的 root PM2 自启动已停用。
- Ubuntu 安全更新来源已修正为 `jammy-security`，自动重启保持关闭；2026-10-23 已补装积累的安全更新并受控重启到 `5.15.0-198-generic`。已卸载启用但不需要的 telnet/inetd。
- GitHub 仓库保持私有；`main` 历史已改写并强制推送，全新 clone 的 tip 与改写镜像一致。

## 待人工执行（按优先级）

1. **P0：由仓库所有者在 DeepSeek 平台轮换 API Key**，再只更新服务器密钥并重启应用；完成前继续保持仓库私有。
2. **已完成：初始管理员密码已存入密码管理器**，服务器上的一次性明文文件 `/home/ubuntu/.merrain-initial-admin-password` 已删除并验证不存在。
3. **P1：决定 `teach.merrain.cn` 的去留。** 该独立 Tunnel 当前返回 Cloudflare 530；修复或删除其 DNS 后，再逐步启用 HSTS，初期不要启用 `includeSubDomains` 或 preload。
4. **处理中：GitHub Support 工单 #4896767 已提交。** 已请求删除缓存视图、对不可达对象执行垃圾回收并确认旧 SHA 不再可访问。Support 完成且复测旧 SHA 无法访问前不得公开。
5. **P2：为 CSP Report-Only 配置收集端并观察合法流量**，完成 nonce 方案后切换强制 CSP。
6. **P2：向腾讯云确认自定义 `cloud-init 20.1.0011-1` 的安全升级路径。** 该包被云厂商精确 pin，配置含 `TencentCloud` 数据源；不要直接取消 pin 并换成 Ubuntu 官方包。若需要消除另外两个 ESM Apps 提示，可为系统启用 Ubuntu Pro，或确认不再需要系统 `python3-pip`/`python3-venv` 后再卸载。

## 残余风险

- CSP 目前为 Report-Only，尚未强制；这是为避免未经线上报告验证就破坏 Next.js hydration/Giscus。
- 主站已用 `max-age=86400` 短周期启用 HSTS；独立的 `teach.merrain.cn` 仍返回 Cloudflare 530，因此暂不启用 `includeSubDomains` 或 preload。确认稳定后再逐步延长主站 max-age。
- 登录与 WebSocket 的短周期限流为单进程内存状态；多实例部署应迁移到 Redis 等共享限流存储。每日 AI 配额已由 SQLite 统一持久化。
- 腾讯云定制 `cloud-init` 被厂商 pin，Ubuntu 报告有一个官方标准安全版本但不会自动替换；它不监听公网，强制升级的启动风险高于当前远程攻击面，需由云厂商确认。另有两个仅属于 ESM Apps 的系统 pip 工具更新，应用生产依赖审计不受影响。
- 全量与生产依赖 `npm audit` 当前均为 0；Dependabot 已配置为每周检查 npm 与 GitHub Actions 更新，CI 会自动执行类型检查、lint、测试和构建。依赖状态仍会随新公告变化，应持续处理后续告警。
- 分支历史和全新 clone 已不含旧认证秘密、票据 PDF 与私有比分 JSON，但 GitHub 服务端仍可按旧 SHA 返回不可达对象；既有 clone 也不会因强制推送自动清理。
- `/download/hackathon/` 已关闭公网访问并返回 404；服务器原文件未删除。`/ncm/` 按业务需要继续保留公网访问。
- WebSocket 排行榜结果由服务器验证，但玩家仍是 Guest 1/Guest 2，并不代表已认证用户身份。

# 安全修复报告

日期：2026-10-22

## 结论

仓库内可执行的高风险修复已经完成并通过自动化验证。生产依赖 `npm audit --omit=dev` 为 0 漏洞；17 项安全测试、TypeScript、lint、Next.js 生产构建与 RSC/HTML 缓存隔离回归均通过。

修复版本已部署到生产源站；管理员密码与会话签名密钥已重新生成，JSON 已迁移到 SQLite，Nginx 与最小权限 Docker 桥已上线。Cloudflare 规则、源站证书恢复、HSTS、DeepSeek 平台密钥轮换和 Git 历史重写仍需按 `docs/` 手册完成。

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
- 历史扫描仍定位到旧认证实现和 19 个票据路径，清理步骤见 `docs/git-history-cleanup.md`。

## 验证命令与结果

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，0 error；保留 13 个既有非阻断 warning |
| `npm test` | 17/17 通过 |
| `npm run build` | Next.js 16.4.2 生产构建通过 |
| `npm run test:rsc` | 源站 RSC/HTML 隔离与 HTML no-store 通过；Cloudflare 公网因旧缓存规则仍失败 |
| `npm audit --omit=dev --json` | 0 vulnerabilities |
| `git diff --check` | 通过；仅有 Windows 行尾提示 |

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

未修改用户原有的 `.claude/settings.local.json`、`.playwright-mcp/`、`src/.claude/`、`src/pictures/`、本地 PDF 或数据库文件。

## 生产部署结果

- 生产运行时固定到用户级 Node.js 24.22.1 LTS；系统 Node 未替换。PM2 的 Web 与 WebSocket 进程均在线并已保存自启动快照。
- 生产环境变量文件权限为 600；数据库与 Hermes 媒体位于代码目录之外。迁移导入 4 条档案、10 条历史练习成绩，原 JSON 和部署前备份均保留。
- 源站 HTTP 返回 301，HTTPS HTML 返回 `private, no-store`，敏感 API 未登录返回 401，CSP Report-Only 生效且不含 `X-Powered-By`。
- Hermes 桥只允许固定容器目录的 `find` 和白名单图片 `cp`；任意 Docker 命令被拒绝。真实登录、CSRF、同步、注销链路通过。
- 生产依赖审计为 0 漏洞；Linux 上 17/17 测试、类型检查、lint（0 error、13 warning）和生产构建通过。
- 部署前完整备份与上一版本目录均保留，可用于回滚。

## 待人工执行（按优先级）

1. **P0：恢复源站证书。** 当前 `merrain.cn`/`www.merrain.cn` 源站证书已过期，Certbot HTTP-01 被 Cloudflare 返回 404；按 Cloudflare 手册临时灰云续期，恢复橙云后切换 Full (strict)。
2. **P0：部署 Cloudflare 缓存绕过并 Purge Everything。** 当前公网仍命中旧 HTML 缓存，RSC 请求会收到 `text/html`；清理后必须运行线上 RSC 回归。
3. **P0：暂时私有化仓库并清理 Git 历史**，协调协作者、fork、release、artifact 和缓存后再强制推送。
4. **P0：通过 SSH 取回初始管理员密码后删除服务器上的一次性明文文件**；在 DeepSeek 平台检查并视暴露情况轮换 API Key。
5. **P1：所有域名和子域 HTTPS 稳定后逐步启用 HSTS**，首次不要启用 `includeSubDomains` 或 preload。
6. **P2：收集 CSP Report-Only 报告**，完成 nonce 方案后切换强制 CSP。

## 残余风险

- CSP 目前为 Report-Only，尚未强制；这是为避免未经线上报告验证就破坏 Next.js hydration/Giscus。
- HSTS 尚未启用，且源站证书当前已过期；需先完成证书恢复并验证所有 HTTPS 子域和回源。
- Cloudflare 仍在缓存旧 HTML；在缓存规则和 Purge 完成前，公网 RSC/HTML 隔离验收不通过。
- 登录与 WebSocket 的短周期限流为单进程内存状态；多实例部署应迁移到 Redis 等共享限流存储。每日 AI 配额已由 SQLite 统一持久化。
- 全量 `npm audit` 仍报告开发工具链漏洞，涉及 eslint-config-next、Tailwind 3 及其 glob/watch 依赖；它们不在生产依赖树中，`--omit=dev` 为 0。升级到 Tailwind 4 会产生破坏性迁移，需单独安排。CI 不应处理攻击者可控的文件路径或启动不可信 watch 输入。
- Git 历史、远程 fork/CDN 和生产缓存中的旧数据不会因当前工作区修改自动消失。
- WebSocket 排行榜结果由服务器验证，但玩家仍是 Guest 1/Guest 2，并不代表已认证用户身份。

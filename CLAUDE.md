# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规范
与用户的对话、代码注释以及思考过程均使用中文。

## 行为规则

1. **同步到云服务器需用户确认**：**禁止**在用户未明确指令的情况下自动通过 SCP 同步文件到云服务器。只有在用户明确要求"同步到服务器"、"部署"等指令后才可执行 SCP 同步、服务器构建和 PM2 重启操作。
2. **Git 推送需用户确认**：**禁止**主动执行 `git push`，该命令只能由用户本人明确发出后才可执行。`git add` 和 `git commit` 也不主动执行，除非用户要求。
3. **敏感信息脱敏**：**禁止**在代码、文档、配置文件中硬编码服务器 IP、SSH 私钥、API 密钥、数据库密码等敏感信息。所有敏感值统一使用 `{{占位符}}` 替代，真实值通过环境变量或外部安全存储注入。
4. **标签数量限制**：所有文章的标签（去重后唯一值）总数不超过 **15 个**。新增文章时优先复用已有标签，每个文章 1~3 个标签，保持粒度一致（领域级而非关键词级）。若现有标签无法覆盖，才考虑新增。

## 项目概述

基于 Next.js 15 + MDX 的个人博客系统，集成了五子棋小游戏、车票生成器、周易六爻排盘解卦、Hermes 图片同步等工具。

## 常用命令

```bash
npm run dev        # 启动开发服务器 (localhost:3000)
npm run ws-server  # 启动五子棋 WebSocket 服务器 (端口 3001)
npm run build      # 生产构建
npm start          # 启动生产服务器
npm run lint       # ESLint 检查
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 (App Router) | 框架，服务端组件优先 |
| TypeScript | 类型安全 |
| Tailwind CSS + `@tailwindcss/typography` | 样式，`class` 暗色模式 |
| MDX (`@next/mdx` + `next-mdx-remote`) | 文章内容，`.mdx` 文件即页面 |
| gray-matter | MDX frontmatter 解析 |
| Fuse.js | 客户端全文搜索 |
| rehype-pretty-code + Shiki | 代码块语法高亮 |
| remark-gfm | GitHub 风格 Markdown |
| remark-breaks | Markdown 单换行转 `<br>` |
| react-markdown | AI 解卦结果 Markdown 渲染 |
| date-fns | 日期格式化 |
| lunar-typescript | 农历/干支/节气计算（周易工具） |
| html2canvas | 车票 DOM 截图（历史依赖，当前打印方案未使用） |
| jspdf | 车票 PDF 生成（历史依赖，当前打印方案未使用） |
| qrcode | 车票二维码生成 |

## 架构

### 目录结构

```
src/
├── app/                        # Next.js App Router
│   ├── about/                  # 关于页
│   ├── api/
│   │   ├── gomoku/              # 五子棋 API (排行榜 + 房间状态)
│   │   ├── media/                # Hermes 图片列表 + 文件服务 (GET, ?name=)
│   │   ├── sync-media/           # Hermes 图片同步 (POST, Bearer auth)
│   │   ├── tools/ticket/parse/     # 车票 AI 文本解析
│   │   └── tools/yijing/         # 周易 API (密码验证 + AI 解卦 + 存档)
│   ├── blog/[slug]/            # 文章详情 (MDX 渲染)
│   ├── gomoku/                 # 五子棋 (在线 + AI + 排行榜)
│   ├── projects/               # 项目展示
│   ├── tags/                   # 标签聚合页
│   ├── tools/                  # 工具箱 (周易六爻 + 车票生成 + Hermes 同步)
│   ├── vocabulary/             # 词汇工具 (词根 + 闪卡 + 背诵)
│   ├── robots.ts / sitemap.ts / opengraph-image.tsx  # SEO
│   └── layout.tsx / page.tsx   # 根布局与首页
├── components/
│   ├── Navbar.tsx / Footer.tsx  # 布局组件
│   ├── PostCard.tsx / ProjectCard.tsx / TicketPreview.tsx
│   ├── SearchBar.tsx / TagFilter.tsx  # 博客搜索与过滤
│   ├── TOC.tsx / BackToTop.tsx / ReadingProgress.tsx  # 阅读体验
│   ├── MDXComponents.tsx / GiscusComments.tsx  # MDX 渲染 + 评论
│   ├── yijing/                  # 周易工具组件 (爻选择器/排盘/AI解卦)
│   └── vocabulary/             # 词汇工具专属组件
├── content/
│   ├── posts/                  # .mdx 文章文件 (9 篇)
│   └── projects.ts            # 项目数据 (静态数组)
├── lib/
│   ├── auth/route-auth.ts      # 共享 HMAC auth (signToken/verifyToken)
│   ├── posts.ts               # 文章加载、搜索、分类、标签
│   ├── types.ts               # Post, Project 类型
│   ├── gomoku/types.ts        # 五子棋排行榜类型
│   └── yijing/                # 周易六爻排盘算法
│       ├── types.ts           # 类型定义
│       ├── paipan.ts          # 排盘主入口
│       ├── calendar.ts        # 农历/真太阳时
│       ├── shensha-calc.ts    # 神煞推算
│       ├── liuqin.ts          # 六亲配卦
│       └── data/              # 六十四卦、神煞表、城市经纬度
├── data/                       # 词汇 JSON + 五子棋排行榜
└── styles/globals.css          # Tailwind 指令 + 全局样式
```

### 博客数据流

```
src/content/posts/*.mdx  →  fs.readFileSync  →  gray-matter 解析
  →  getAllPosts() 返回 Post[]  →  RSC 页面渲染 / Fuse.js 搜索
```

文章通过文件系统读取，无需数据库。`src/lib/posts.ts` 提供 `getAllPosts`、`getPostBySlug`、`searchPosts`、`getPostsByCategory`、`getPostsByTag`、`getAdjacentPosts` 等函数。

### 路径别名

`@/*` → `./src/*` (在 `tsconfig.json` 中配置)

### 暗色模式

- Tailwind `darkMode: "class"`，通过 `layout.tsx` 中的内联脚本在页面加载前初始化
- `Navbar.tsx` 中的按钮切换 `dark` class 并写入 `localStorage`

### MDX 配置

`next.config.ts` 中通过 `@next/mdx` 配置了 `remark-gfm` 和 `rehype-pretty-code`（主题 `github-dark`），`.mdx` 文件可直接作为页面路由。

文章实际渲染使用 `next-mdx-remote/rsc`（`src/app/blog/[slug]/page.tsx:129`），搭配 `MDXComponents` 自定义组件。MDX 源文件经 `@mdx-js/mdx` 编译为 JSX，再由 React Server Components 渲染。

### MDX 内容编写关键规则

#### HTML 注释禁令

**MDX 不支持 HTML 注释 `<!-- ... -->`！** 这是最常见的 MDX 坑之一。

- ❌ `<!-- 这是一段注释 -->` — MDX 解析器看到 `!` 字符后报错：`Unexpected character ! (U+0021) before name`
- ✅ `{/* 这是一段注释 */}` — 使用 JSX 风格注释
- 受影响场景：内联 SVG 图表中的注释、HTML 模板粘贴到 MDX 时带注释

**实际踩坑**：在 MDX 中嵌入 SVG 图表时，SVG 内部的 `<!-- 背景 -->`、`<!-- X 轴 -->` 等注释导致页面返回 500。`npm run build` 虽然成功（SSG 降级为动态渲染），但实际访问时 MDX 编译抛异常。解决方法：去掉 SVG 中所有 HTML 注释行。

#### 图表方案（重要更新 2026-06-16）

> **内联 SVG 在 MDX 中已被弃用，改用 PNG + `![]()` 引用。**

内联 SVG 的两大坑：
1. HTML 注释 `<!-- -->` → 触发 `Unexpected character !` 错误
2. CSS 花括号 `{ }` → 触发 `Could not parse expression with acorn` 错误（即使 `` {`...`} `` 包裹也治标不治本）

**当前方案：Python matplotlib → PNG → `![]()` 引用**
- 生成脚本：`scripts/generate_blog_charts.py`
- 图片目录：`public/images/blog/*.png`
- MDX 引用：`![alt text](/images/blog/xxx.png)`（标准 Markdown，不经 MDX 编译器）
- 优点：零 MDX 解析风险，构建永远成功
- 缺点：白底图片在暗色模式下无自动切换（可接受）

### 部署后验证规则

**`npm run build` 成功 ≠ 所有页面正常渲染。** SSG 页面的 MDX 编译错误可能不阻塞构建，但会导致具体路由返回 500。

每次部署后必须验证：

```bash
# 1. 先验证服务器本地（绕过 Cloudflare 缓存）
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/blog/<slug>"

# 2. 检查实际渲染内容是否包含预期元素
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} \
  "curl -s http://localhost:3000/blog/<slug> | grep -c '<svg'"

# 3. 服务器本地确认无误后，再验证 CDN 侧
curl -s -o /dev/null -w "%{http_code}" "https://merrain.cn/blog/<slug>"
```

**排查顺序**：服务器本地 3000 → CDN 外网。若服务器本地正常但外网异常 → Cloudflare 缓存问题；若服务器本地也异常 → 代码/构建问题。

## 五子棋在线对战

### 架构

```
iframe (public/gomoku/index.html) ← postMessage → React 父组件 ← WebSocket → ws-server (端口 3001)
```

- `server/ws-server.ts` — 独立 WebSocket 服务器，房间管理/落子转发/胜负判定
- `server/room-store.ts` — 共享内存状态，2 个固定房间 (A/B)
- `src/app/gomoku/online/` — 在线大厅 + 房间对局页
- `src/app/api/gomoku/rooms/route.ts` — 房间状态查询 API
- `public/gomoku/index.html` — 游戏引擎新增 `online` 模式

### 消息流

1. 玩家进入房间 → WebSocket `join-room` → 分配 Guest 1/2
2. Guest 1 等待 30s，无人加入自动解散
3. 对局中落子 → postMessage → WebSocket `place-piece` → 服务器校验转发 `opponent-move`
4. 服务器判定胜负 → 广播 `game-over`

## 周易六爻排盘解卦

### 架构

```
密码门控（POST /api/tools/yijing/auth，HMAC 签名 token）
  → 用户选择六爻 → paipan() 客户端排盘（毫秒级） → PaipanDisplay 展示
  → POST /api/tools/yijing/interpret → DeepSeek API ×4（3 视角并行 + 1 综合）
  → AIInterpret 展示 → 保存结果到 localStorage + 服务端 JSON 文件（双向同步）
```

- `src/app/tools/yijing/page.tsx` — 主页面，密码验证 + 表单 + 排盘 + AI 解卦 + 保存
- `src/app/api/tools/yijing/auth/route.ts` — 密码验证 API，返回 HMAC 签名 token（24h 有效）
- `src/app/api/tools/yijing/interpret/route.ts` — AI 解卦 API，多方交叉验证
- `src/app/api/tools/yijing/archives/route.ts` — 存档 API，服务端 JSON 文件持久化（GET/POST/DELETE）
- `src/lib/yijing/paipan.ts` — 排盘主入口：四柱、卦象匹配、变卦、六亲、神煞
- `src/lib/yijing/calendar.ts` — 农历/真太阳时（基于 `lunar-typescript`）
- `src/lib/yijing/shensha-calc.ts` — 神煞推算（天乙贵人/文昌/禄神/驿马/桃花/华盖/亡神）
- `src/lib/yijing/liuqin.ts` — 六亲配卦（宫五行 vs 爻五行生克）
- `src/lib/yijing/data/bagua.ts` — 六十四卦完整数据（卦辞/爻辞/纳甲五行）
- `src/lib/yijing/data/regions.ts` — ~280 个中国城市经纬度
- `src/components/yijing/` — YaoSelector / PaipanDisplay / AIInterpret / ArchivePanel 组件（存档用 localStorage + 服务端双向同步，自定义事件通信）

### 解卦流程

1. 3 个独立视角并行调用 DeepSeek：卦象解读(temp=0.3) / 动爻解读(temp=0.5) / 综合建议(temp=0.7)
2. 结果汇总后第四次调用综合整合(temp=0.5)
3. 单个视角失败时降级：跳过该视角，用剩余视角综合

## Hermes 图片同步

### 架构

```
密码门控（共享周易 token，sessionStorage "yijing-auth"）
  → POST /api/sync-media（Docker exec + cp 从 hermes-agent 容器同步）
  → GET /api/media（列出 public/hermes/ 图片，?name= 下载文件）
  → 前端预览网格 + 下载按钮
```

- `src/app/tools/hermes/page.tsx` — 主页面，密码门控 + 同步按钮 + 图片网格
- `src/app/api/sync-media/route.ts` — POST，从 hermes-agent 容器同步图片到 `public/hermes/`
- `src/app/api/media/route.ts` — GET，图片列表（JSON）或文件下载（`?name=xxx`）
- `src/lib/auth/route-auth.ts` — 共享 HMAC-SHA256 token 签发/验证，24h TTL

### Nginx 缓存注意事项

**新增工具页面时必须同步更新 Nginx 配置：**
- **443 端口**：为页面路径加 `proxy_hide_header Cache-Control` + `add_header Cache-Control "no-cache"`，否则 Next.js 的 `s-maxage=31536000` 会让 Cloudflare 缓存 HTML 一年
- **80 端口**：Cloudflare Tunnel 实际走 80 端口，需要加对应的 `location` 块（`/_next/static` 和工具页面路径），否则会被 `return 301` 重定向形成死循环

当前 Nginx 特殊处理路径：`/projects`、`/blog`、`/tools`（含所有子路径如 `/tools/ticket`、`/tools/hermes` 等）均已配置缓存剥离。静态资源 `/hermes/` 和 `/_next/static` 走独立 location 块，无需剥离。

## 车票生成器

### 架构

```
表单填写 / AI 文本识别（POST /api/tools/ticket/parse → DeepSeek）
  → TicketPreview 组件实时预览（856×540 基准尺寸，自适应缩放）
  → 浏览器直接打印 / 批量打印（@page 规格对齐物理尺寸，自动分页正反面）
```

- `src/app/tools/ticket/page.tsx` — 主页面，表单编辑 + AI 解析 + 打印导出
- `src/app/api/tools/ticket/parse/route.ts` — AI 文本解析 API，从 12306 电子发票原始文本提取字段
- `src/components/TicketPreview.tsx` — 车票预览组件，支持蓝票/红票双样式，含背面内容，打印导出

### 技术要点

- **物理规格**：85.6mm × 53.98mm（PDF 和直接打印统一），正反面相同尺寸
- **背面**：PDF 第二页 + 打印 @page 第二页，屏幕隐藏，预留后期添加内容
- **背景渲染**：使用 `<img>` 标签而非 CSS `background-image`，渲染更可靠
- **字体设置**：站名用 SimHei/黑体，正文用 SimSun/宋体，车次用 Mongolian Baiti
- **扫描件效果**：条纹底纹用 CSS repeating-linear-gradient 模拟
- **二维码**：qrcode 库生成 SVG，`color.light: "#00000000"` 透明底色
- **无座处理**：seatNumber 为"无座"时不追加"号"字，seatType 强制显示为"二等座"
- **特殊席别**："新空调硬座"和"硬卧代硬座"字体右移 20px
- **AI 解析增强**：识别"02车无座"连写格式、复合席别"新空调硬座"和"硬卧代硬座"

## 服务器部署

### 服务器信息

| 项目 | 值 |
|------|-----|
| 域名 | **merrain.cn** / **www.merrain.cn** |
| IP | {{SERVER_IP}} |
| 系统 | Ubuntu 22.04 LTS |
| 配置 | 2核2G 4M带宽 50GB SSD |
| SSH 用户 | ubuntu |
| SSH 密钥 | `claude_private.pem` (RSA 2048) |
| SSH 连接 | `ssh -i claude_private.pem ubuntu@{{SERVER_IP}}` |
| 项目路径 | `/home/ubuntu/myblogger` |
| Web 服务 | Nginx (80/443) → Next.js (3000)，HTTP 自动跳转 HTTPS |
| SSL 证书 | Let's Encrypt，自动续期，certbot 管理 |
| 进程管理 | PM2 |
| DNS 托管 | 腾讯云 DNSPod |

### PM2 进程

| 名称 | 命令 | 端口 |
|------|------|------|
| myblogger | `npm start` (next start) | 3000 |
| ws-gomoku | `npx tsx server/ws-server.ts` | 3001 |

### 部署流程

```bash
# 1. 提交代码
git add <files> && git commit && git push origin main

# 2. 同步到服务器
scp -i claude_private.pem -r <changed-files> ubuntu@{{SERVER_IP}}:/home/ubuntu/myblogger/scp-tmp/
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} "
  cd /home/ubuntu/myblogger
  cp scp-tmp/... <targets>
  npm install
  npm run build
  pm2 restart myblogger ws-gomoku
  pm2 save
"
```

### 服务器命令速查

```bash
# 查看服务状态
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} "pm2 list"

# 查看日志
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} "pm2 logs --lines 50"

# 重启服务
ssh -i claude_private.pem ubuntu@{{SERVER_IP}} "pm2 restart myblogger ws-gomoku"
```

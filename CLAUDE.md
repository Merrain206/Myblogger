# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规范
与用户的对话、代码注释以及思考过程均使用中文。

## 行为规则

1. **自动同步到云服务器**：每次修改项目代码后（不含 .md 文档、不含 .git/），完成构建验证通过后，自动通过 SCP 将变更文件同步到云服务器（{{SERVER_IP}}），执行 `npm run build` 并重启 PM2 进程。
2. **Git 推送需用户确认**：**禁止**主动执行 `git push`，该命令只能由用户本人明确发出后才可执行。`git add` 和 `git commit` 也不主动执行，除非用户要求。
3. **敏感信息脱敏**：**禁止**在代码、文档、配置文件中硬编码服务器 IP、SSH 私钥、API 密钥、数据库密码等敏感信息。所有敏感值统一使用 `{{占位符}}` 替代，真实值通过环境变量或外部安全存储注入。

## 项目概述

基于 Next.js 15 + MDX 的个人博客系统，集成了五子棋小游戏。

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
| date-fns | 日期格式化 |

## 架构

### 目录结构

```
src/
├── app/                        # Next.js App Router
│   ├── api/gomoku/score/       # 五子棋排行榜 API (GET/POST)
│   ├── blog/[slug]/            # 文章详情 (MDX 渲染)
│   └── gomoku/                 # 五子棋页面 (游戏 + 排行榜)
├── components/
│   ├── Navbar.tsx              # 导航栏 + 暗色模式切换
│   ├── PostCard.tsx / ProjectCard.tsx
│   ├── SearchBar.tsx / TagFilter.tsx  # 博客搜索与过滤
│   ├── TOC.tsx                 # 文章目录 (IntersectionObserver)
│   └── MDXComponents.tsx       # MDX 自定义组件映射
├── content/
│   ├── posts/                  # .mdx 文章文件
│   └── projects.ts            # 项目数据 (静态数组)
├── lib/
│   ├── posts.ts               # 文章加载、搜索、分类、标签
│   ├── types.ts               # Post, Project 类型
│   └── gomoku/types.ts        # 五子棋排行榜类型
├── data/gomoku-scores.json     # 五子棋排行榜持久化 (JSON 文件)
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

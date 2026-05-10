# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规范
与用户的对话、代码注释以及思考过程均使用中文。

## 项目概述

基于 Next.js 15 + MDX 的个人博客系统，集成了五子棋小游戏。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:3000)
npm run build    # 生产构建
npm start        # 启动生产服务器
npm run lint     # ESLint 检查
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

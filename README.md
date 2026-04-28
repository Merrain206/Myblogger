# MyBlogger

基于 Next.js 15 + MDX 的个人博客系统，支持暗色模式、全文搜索、分类标签和代码高亮。

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 (App Router) | 框架 + 服务端组件 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式与响应式设计 |
| MDX + next-mdx-remote | 文章内容管理 |
| gray-matter | Frontmatter 解析 |
| Fuse.js | 客户端全文搜索 |
| rehype-pretty-code + Shiki | 代码语法高亮 |
| remark-gfm | GitHub 风格 Markdown |
| date-fns | 日期格式化 |

## 功能特性

- **MDX 文章管理** — 文件系统存储，无需数据库
- **实时搜索** — 关键词匹配，即时过滤
- **分类/标签过滤** — 按标签筛选文章
- **暗色/亮色模式** — localStorage 持久化，跟随系统
- **文章目录 (TOC)** — IntersectionObserver 滚动追踪
- **代码高亮** — rehype-pretty-code + Shiki 多主题支持
- **代码复制** — 一键复制代码块内容
- **响应式设计** — 移动端优先，全设备适配
- **上一篇/下一篇** — 文章底部导航

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

访问 [http://localhost:3000](http://localhost:3000) 即可查看。

## 项目结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── about/        # 关于页
│   ├── blog/         # 博客列表 + 文章详情
│   └── projects/     # 项目展示
├── components/       # 通用组件 (Navbar, Footer, PostCard 等)
├── content/
│   ├── posts/        # MDX 文章文件
│   └── projects.ts   # 项目数据
├── lib/              # 工具函数与类型
└── styles/           # 全局样式
```

## 添加文章

在 `src/content/posts/` 目录下创建 `.mdx` 文件，使用 Frontmatter 格式：

```mdx
---
title: "文章标题"
date: "2026-04-01"
tags: ["Next.js", "MDX"]
description: "文章描述"
---

文章正文，支持 Markdown 和 React 组件。
```

## 部署

项目为纯静态友好的 Next.js 应用，可部署到：

- [Vercel](https://vercel.com)（推荐）
- Cloudflare Pages
- 任何支持 Node.js 的服务器

```bash
npm run build
# 输出目录: .next
```

## 链接

- 作者 GitHub: [@Merrain206](https://github.com/Merrain206)
- 邮箱: [merrain0206@163.com](mailto:merrain0206@163.com)

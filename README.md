# MyBlogger

基于 Next.js 15 + MDX 的个人博客系统，集成五子棋在线对战和构词法记单词工具。

## 功能特性

### 博客
- MDX 文章管理，文件系统存储无需数据库
- Fuse.js 全文搜索，关键词即时过滤
- 分类 / 标签筛选
- 暗色 / 亮色模式，localStorage 持久化
- 文章目录 (TOC)，IntersectionObserver 滚动追踪
- 代码语法高亮 + 一键复制
- Giscus 评论区集成
- sitemap / robots / OpenGraph 图片生成

### 词汇工具
- **词根词缀法学习** — 120+ 词根分组，CET4/CET6 全覆盖
- **闪卡复习** — 翻转查看释义，键盘快捷键，随机 / 顺序模式
- **背诵记忆** — SM-2 间隔重复算法，多用户进度保存，断点续传
- 用户名区分进度，所有数据存于浏览器 localStorage

### 五子棋
- **在线房间对战** — WebSocket 实时通信，双房间支持
- **AI 对战** — 可与电脑对弈
- 游戏排行榜 API
- 落子校验、悔棋、重新开始

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 (App Router) | 框架，服务端组件优先 |
| TypeScript | 类型安全 |
| Tailwind CSS + `@tailwindcss/typography` | 样式，`class` 暗色模式 |
| MDX (`@next/mdx` + `next-mdx-remote`) | 文章内容 |
| gray-matter | Frontmatter 解析 |
| Fuse.js | 客户端全文搜索 |
| rehype-pretty-code + Shiki | 代码高亮 |
| remark-gfm | GitHub 风格 Markdown |
| date-fns | 日期格式化 |
| ws | WebSocket 服务器（五子棋在线对战） |
| @giscus/react | 博客评论区 |

## 快速开始

```bash
npm install
npm run dev        # 启动开发服务器 (localhost:3000)
npm run ws-server  # 启动五子棋 WebSocket 服务器 (端口 3001)
npm run build      # 构建生产版本
npm start          # 启动生产服务器
```

## 项目结构

```
├── server/
│   ├── ws-server.ts              # 五子棋 WebSocket 服务器
│   ├── room-store.ts             # 房间状态管理
│   └── nginx-myblogger.conf      # Nginx 配置
├── src/
│   ├── app/
│   │   ├── about/                # 关于页
│   │   ├── api/gomoku/           # 五子棋排行榜 + 房间状态 API
│   │   ├── blog/                 # 博客列表 + 文章详情
│   │   ├── gomoku/
│   │   │   ├── online/room/      # 在线房间对战页
│   │   │   ├── play/             # AI 对战页
│   │   │   └── leaderboard/      # 排行榜页
│   │   ├── projects/             # 项目展示
│   │   ├── vocabulary/           # 词汇工具 (词根浏览 + 闪卡 + 背诵)
│   │   ├── opengraph-image.tsx   # OG 图片生成
│   │   ├── robots.ts             # robots.txt
│   │   └── sitemap.ts            # sitemap.xml
│   ├── components/
│   │   ├── vocabulary/           # 词汇专属组件 (7 个)
│   │   └── GiscusComments.tsx    # Giscus 评论区组件
│   ├── content/
│   │   ├── posts/                # MDX 文章
│   │   └── projects.ts           # 项目数据
│   ├── data/                     # 词汇 JSON、五子棋排行榜
│   ├── lib/                      # 工具函数与类型
│   └── styles/                   # 全局样式
└── public/gomoku/                # 五子棋游戏引擎
```

## 部署

项目已部署在腾讯云服务器（Ubuntu 22.04 + Nginx + PM2 + Let's Encrypt SSL）。

```bash
# 本地构建后同步到服务器
tar czf - --exclude='node_modules' --exclude='.next' --exclude='.git' . \
  | ssh -i {{SSH_KEY_PATH}} ubuntu@{{SERVER_IP}} \
    "cd ~/myblogger && tar xzf - && npm install && npm run build && pm2 restart myblogger ws-gomoku"
```

也支持一键部署到 Vercel。

## 链接

- 线上地址: [https://merrain.cn](https://merrain.cn)
- GitHub: [@Merrain206](https://github.com/Merrain206)
- 邮箱: [merrain0206@163.com](mailto:merrain0206@163.com)

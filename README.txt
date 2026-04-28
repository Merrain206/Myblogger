  项目结构

  Myblogger/
  ├── src/app/           # 页面 (Next.js App Router)
  │   ├── page.tsx       # 首页 (Hero + 最新文章 + 精选项目)
  │   ├── blog/          # 博客列表 (搜索 + 标签过滤)
  │   └── blog/[slug]/   # 文章详情 (MDX + 目录 + 上下篇)
  │   ├── projects/      # 项目展示页
  │   └── about/         # 关于我
  ├── src/components/    # React 组件
  │   ├── Navbar.tsx     # 导航栏 (含暗色模式切换 + 移动端菜单)
  │   ├── PostCard.tsx   # 文章卡片
  │   ├── ProjectCard.tsx# 项目卡片
  │   ├── SearchBar.tsx  # 搜索组件
  │   ├── TagFilter.tsx  # 标签过滤
  │   ├── TOC.tsx        # 文章目录
  │   └── MDXComponents.tsx # MDX 自定义组件 (代码高亮 + 复制)
  ├── src/content/posts/ # 博客文章 (3 篇示例 MDX)
  ├── src/lib/           # 核心逻辑 (文章解析 + 搜索)
  └── src/styles/globals.css # 全局样式

  功能特性

  - 暗色/亮色模式切换
  - 文章全文搜索 + 标签过滤
  - 文章详情页 (MDX 渲染 + 代码高亮 + 目录 + 上下篇导航)
  - 项目展示页 (精选/其他分类)
  - 响应式设计 (移动端适配)

  常用命令

  npm run dev    # 启动开发服务器
  npm run build  # 生产构建

  要添加新文章，只需在 src/content/posts/ 下新建 .mdx 文件即可。你可以在 src/content/projects.ts 中修改项目数据，在
  src/app/about/page.tsx 中完善个人信息。

✻ Baked for 30m 49s
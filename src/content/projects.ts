import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    title: "课堂 AI 领航员",
    slug: "teaching-agent",
    description:
      "实时课堂语音分析系统，集声纹识别、说话人分离与 LLM 智能评估于一体。基于 FastAPI + FunASR + DeepSeek 构建，支持在线流式和离线长音频两种模式。",
    techStack: ["Python", "FastAPI", "FunASR", "DeepSeek", "MySQL", "ModelScope", "WebSocket"],
    githubUrl: "https://github.com/Merrain206/teaching-agent",
    featured: true,
    longDescription: `课堂 AI 领航员是一个面向教育场景的智能语音分析系统（V4.1）。系统通过麦克风阵列采集课堂音频，经由 WebSocket 实时流式传输到后端，利用 FunASR（paraformer-zh + VAD + 标点恢复）进行语音识别与说话人分离，ModelScope campplus 16k 模型进行 1 对 N 声纹比对，最后通过 DeepSeek V4 大模型对学生回答进行智能评分与行为判定（主动抢答 / 被动点名）。

系统支持两种工作模式：
- **在线模式**：通过 WebSocket 实时流式处理课堂音频，边上课边分析，前端大屏实时展示
- **离线模式**：支持分片上传绕过 Cloudflare 100s 超时限制，后台异步完成音频切分、声纹认领、LLM 评分全流程，自动生成报告`,
    features: [
      "实时语音识别 + 说话人分离 (FunASR paraformer-zh v2.0.4 + fsmn-vad + ct-punc)",
      "1对N 声纹识别 (ModelScope campplus 16k 缓存) + 声纹身份分类 (老师/学生)",
      "LLM 智能评分 (DeepSeek V4 Flash/Pro 双模型智能降级)",
      "主动/被动回答行为判定 (抢答 vs 点名) + 异步文本润色修复标点",
      "五维雷达图评估引擎 (互动积极性/准确度/发散性/专注度/掌握度)",
      "学生跨课堂纵向画像 (历史记录追踪，学期总评基础)",
      "在线 WebSocket 流式处理 + 离线长音频静音切分全自动流水线",
      "自动生成课堂成绩单 (Excel) 和导师语录润色版 (TXT)",
      "未知声纹认领机制 (未识别声音暂存 + 手动认领 + 身份标注)",
      "声纹平滑与黏滞判定 (解决短促停顿被误判为切换发言人)",
      "GPU 算力池管理 (asyncio.Lock 排队 + CUDA 40/50 系兼容优化)",
      "后台管理面板 (实时日志流、文件管理、CPU/GPU/内存监控、数据打包备份)",
      "分片上传机制 (绕过 Cloudflare 100s 代理超时限制)",
    ],
    architecture: `## 数据流

\`\`\`
[麦克风阵列] → WebSocket (/ws/audio) → ASR + 说话人分离 (FunASR paraformer-zh + fsmn-vad + ct-punc)
    → 声纹识别 (ModelScope campplus 16k 缓存)
    → 文本累积与说话人拼接 → LLM 评估 (DeepSeek V4 Flash/Pro 双模型智能降级)
    → MySQL 存储 (class_sessions / teacher_timeline / performance_records)
    → 实时推送前端大屏
\`\`\`

## 数据库三张表

| 表名 | 说明 |
|------|------|
| class_sessions | 课堂会话记录 (课程名/开始/结束时间) |
| teacher_timeline | 导师发言时间轴 (AI 润色后，用于课后复盘) |
| performance_records | 学生表现全维度记录 (分数、关键词、回答模式、录音路径) |

## 离线处理流水线

\`\`\`
长音频 → 静音切分 (pydub) → GPU 锁排队 → ASR 识别 → 声纹比对
    → 说话人黏滞合并 → 教师文本润色 → 学生回答评分 → 数据库落盘
    → 生成 Excel 成绩单 + TXT 导师语录
\`\`\`

## 雷达图引擎

5 个维度实时计算：互动积极性、回答准确度、思维发散性、课堂专注度、知识掌握度。支持全班聚合和个人画像两种视图。`,
  },
  {
    title: "Simuro 机器人足球",
    slug: "simuro",
    description:
      "5v5 机器人足球仿真策略，采用人工势场避障、球轨迹预测和基于角色的定位系统。",
    techStack: ["Python", "PID 控制", "APF 算法"],
    githubUrl: "https://github.com/Merrain206/simuro",
    longDescription: `Simuro 是一个兼容 PyV5Adapter 的 5v5 机器人足球仿真策略项目。

核心策略基于人工势场 (APF) 算法实现智能避障，结合球轨迹预测和基于角色的定位系统 (守门员、前锋、中场、后卫)，让多个机器人能够协同作战。`,
    features: [
      "人工势场 (APF) 智能避障",
      "球轨迹预测算法",
      "基于角色的定位系统 (守门员/前锋/中场/后卫)",
      "PID 控制器用于精确移动",
      "60 拍/秒 实时决策循环",
    ],
  },
  {
    title: "AI 五子棋",
    slug: "ai-gomoku",
    description:
      "15x15 五子棋对战，支持人机对弈和在线联机。AI 采用 Minimax + Alpha-Beta 剪枝 + 杀手启发式，WebSocket 实时通信，Nginx 反向代理部署。",
    techStack: ["HTML/CSS", "JavaScript", "Canvas", "Minimax", "WebSocket", "Nginx", "PM2"],
    demoUrl: "/gomoku",
    featured: true,
    features: [
      "人机对战 + 在线联机双模式（已移除本地双人模式）",
      "三级 AI 难度：简单（启发式评分无搜索）/ 中等（深度4）/ 困难（深度6 + 走法排序裁剪）",
      "Minimax 搜索 + Alpha-Beta 剪枝 + 杀手走法启发式 + 走法排序优化",
      "WebSocket 实时通信，2 间固定房间，Guest 1 等待 30s 自动解散，房间断线自动重置",
      "Nginx 反向代理 WebSocket（/ws → 127.0.0.1:3001），wss:// 自动适配",
      "iframe + postMessage 架构：游戏引擎与 React 父组件解耦通信",
      "房间状态跨进程共享（room-summaries.json），大厅 3s 轮询实时刷新",
      "Canvas 绘制木质棋盘，棋子 3D 径向渐变光泽效果，悬停预览",
      "悔棋（Ctrl+Z）：人机模式一次撤两步，在线模式实时同步对手",
      "再来一局投票机制：双方均同意后自动重置棋盘",
      "排行榜 API + 成绩提交（JSON 文件持久化，按难度/步数排序，支持筛选）",
      "胜利连线高亮 + 平局/超时/对手离开多场景处理",
    ],
  },
  {
    title: "MyBlogger",
    slug: "myblogger",
    description:
      "基于 Next.js 15 + MDX 的个人博客系统，集全文搜索、评论、SEO、工具箱、构词法记单词于一体，已部署生产。",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "MDX", "Fuse.js", "Nginx", "PM2"],
    featured: true,
    longDescription: `MyBlogger 是我用 Next.js 15 + MDX 构建的个人博客系统（本网站）。

采用 App Router 架构，所有页面使用服务端组件 (RSC)，博客列表页的搜索和过滤功能通过客户端组件实现。内容管理采用文件系统的 MDX 格式，无需数据库。

除博客核心功能外，还集成了两个实用模块：**工具箱**（12306 车票生成器，输入电子发票信息生成蓝色纸质报销凭证样式 PDF，支持下载打印）和**构词法记单词**（通过词根/前缀/后缀分解记忆，涵盖 CET4/CET6 词汇，支持闪卡翻页和学习模式）。

已部署至腾讯云轻量服务器，Nginx 反向代理 + Let's Encrypt SSL，PM2 进程守护。`,
    features: [
      "Next.js 15 App Router + RSC（服务端组件优先）",
      "MDX 文章内容管理 (文件系统存储，无需数据库)",
      "Fuse.js 客户端实时搜索 (关键词匹配)",
      "分类/标签过滤系统",
      "暗色/亮色模式切换 (Tailwind class + localStorage 持久化)",
      "文章目录 (TOC) 滚动追踪 (IntersectionObserver)",
      "代码块语法高亮 (rehype-pretty-code + Shiki) + 一键复制",
      "Giscus 评论系统 (GitHub Discussions 驱动，主题自适应)",
      "SEO 优化 (sitemap.xml / robots.txt / OpenGraph 动态封面图)",
      "构词法记单词系统：词根/前缀/后缀分解记忆 + 闪卡/学习模式，涵盖 CET4/CET6",
      "工具箱模块：12306 车票生成器（电子发票信息生成蓝色纸质报销凭证样式 PDF）",
      "Nginx 反向代理 + Let's Encrypt SSL + gzip + 静态资源强缓存",
      "PM2 进程管理 (myblogger + ws-gomoku 双进程)",
      "响应式设计 (移动端优先) + 上一篇/下一篇导航",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | null {
  return projects.find((p) => p.slug === slug) || null;
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

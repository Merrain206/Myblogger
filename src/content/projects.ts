import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    title: "课堂 AI 领航员",
    slug: "teaching-agent",
    description:
      "实时课堂语音分析系统，具备声纹识别和 LLM 评估功能。基于 FastAPI、FunASR 和 Qwen 大模型构建，支持在线课堂和离线音频两种模式。",
    techStack: ["Python", "FastAPI", "FunASR", "Qwen", "MySQL", "ModelScope", "WebSocket"],
    githubUrl: "https://github.com/Merrain206/teaching-agent",
    featured: true,
    longDescription: `课堂 AI 领航员是一个面向教育场景的智能语音分析系统。系统通过麦克风阵列采集课堂音频，经由 WebSocket 实时流式传输到后端，利用 FunASR 进行语音识别，ModelScope campplus 模型进行声纹比对，最后通过 Qwen 大模型对学生的回答进行智能评分和分析。

系统支持两种工作模式：
- **在线模式**：通过 WebSocket 实时流式处理课堂音频，边上课边分析
- **离线模式**：上传完整的课堂录音文件，系统自动切分、识别、评分并生成报告`,
    features: [
      "实时语音识别 (FunASR paraformer-zh v2)",
      "1对N 声纹识别 (ModelScope campplus, 16k 缓存优化)",
      "LLM 智能评分 (Qwen-plus/max/turbo 多模型故障转移)",
      "主动/被动回答行为判定 (抢答 vs 点名)",
      "在线 WebSocket 流式处理 + 离线长音频解析",
      "自动生成课堂成绩单 (Excel) 和导师语录 (TXT)",
      "未知声纹认领机制 (未识别声音暂存 + 手动认领)",
      "声纹平滑与黏滞判定 (解决短促停顿被误判问题)",
      "后台管理面板 (日志、文件管理、系统监控、数据备份)",
      "GPU 算力池管理 (async lock 排队机制)",
    ],
    architecture: `## 数据流

\`\`\`
[麦克风阵列] → WebSocket (/ws/audio) → VAD/ASR (FunASR paraformer-zh)
    → 声纹识别 (ModelScope campplus 16k 缓存)
    → 文本累积与说话人拼接 → LLM 评估 (Qwen 多模型故障转移)
    → MySQL 存储 (class_sessions / teacher_timeline / performance_records)
    → 实时推送前端大屏
\`\`\`

## 数据库三张表

| 表名 | 说明 |
|------|------|
| class_sessions | 课堂会话记录 (开始/结束时间) |
| teacher_timeline | 导师发言时间轴 (用于课后复盘) |
| performance_records | 学生表现全维度记录 (分数、关键词、回答模式) |`,
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
      "15x15 五子棋对战，支持双人和人机模式。AI 采用 Minimax + Alpha-Beta 剪枝，深度可达 6 层，具备精确的连珠模式评估。",
    techStack: ["HTML/CSS", "JavaScript", "Canvas", "Minimax", "Alpha-Beta 剪枝"],
    demoUrl: "/gomoku",
    featured: true,
    features: [
      "人机对战 + 双人对战双模式",
      "三级 AI 难度：简单（启发式）/ 中等（深度4）/ 困难（深度6）",
      "Minimax 搜索 + Alpha-Beta 剪枝 + 杀手走法启发式",
      "精确连珠模式评估：活四/冲四/活三/眠三 分类计分",
      "Canvas 绘制木质棋盘，棋子 3D 光泽效果",
      "悔棋（Ctrl+Z）、悬停预览、获胜连线高亮",
      "排行榜 API + 成绩提交系统",
    ],
  },
  {
    title: "MyBlogger",
    slug: "myblogger",
    description:
      "基于 Next.js + MDX 的个人博客系统，支持全文搜索、分类标签和暗色模式。",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "MDX", "Fuse.js"],
    featured: true,
    longDescription: `MyBlogger 是我用 Next.js 15 + MDX 构建的个人博客系统。

采用 App Router 架构，所有页面使用服务端组件 (RSC)，博客列表页的搜索和过滤功能通过客户端组件实现。内容管理采用文件系统的 MDX 格式，无需数据库。`,
    features: [
      "Next.js 15 App Router + RSC",
      "MDX 文章内容管理 (无需数据库)",
      "客户端实时搜索 (关键词匹配)",
      "分类/标签过滤系统",
      "暗色/亮色模式切换 (localStorage 持久化)",
      "文章目录 (TOC) 滚动追踪 (IntersectionObserver)",
      "代码块语法高亮 (rehype-pretty-code + Shiki)",
      "代码块一键复制功能",
      "响应式设计 (移动端优先)",
      "上一篇/下一篇导航",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | null {
  return projects.find((p) => p.slug === slug) || null;
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

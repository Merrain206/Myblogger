import Link from "next/link";

const tools = [
  {
    title: "周易六爻排盘解卦",
    description: "录入手动摇卦结果，自动推算四柱、神煞、六亲、变卦，结合 AI 多方交叉验证解卦。",
    href: "/tools/yijing",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12M6 8h12M8 12h8M10 16h4M12 20V4" />
      </svg>
    ),
  },
  {
    title: "车票生成器",
    description: "输入电子发票信息，生成 12306 蓝色纸质报销凭证样式的 PDF，支持下载打印。",
    href: "/tools/ticket",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    title: "Hermes 图片同步",
    description: "从 Hermes Agent 同步 SVG/Mermaid/ECharts 图表到博客，支持在线预览和下载。",
    href: "/tools/hermes",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "构词法记单词",
    description: "通过词根、前缀、后缀分解记忆，涵盖 CET4/CET6 词汇，支持闪卡和学习模式。",
    href: "/vocabulary",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
          工具箱
        </h1>
        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
          实用小工具，让生活更方便
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
          >
            <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              {tool.icon}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

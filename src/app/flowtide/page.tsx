import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Flowtide 心流潮汐",
  description:
    "Flowtide 心流潮汐 —— 让专注与休息像潮汐一样自然涨落的 AI 专注番茄钟。心流保护、专业声景、音乐联动、AI 计划与复盘，数据全部存在本机。",
  keywords: [
    "Flowtide",
    "心流潮汐",
    "番茄钟",
    "专注",
    "AI",
    "声景",
    "网易云音乐",
    "Android",
  ],
  openGraph: {
    title: "Flowtide 心流潮汐 · AI 专注番茄钟",
    description:
      "让专注与休息像潮汐一样自然涨落的 AI 专注番茄钟。心流保护 · 声景音乐 · AI 计划复盘 · 本地优先。",
    url: "https://merrain.cn/flowtide",
    images: [{ url: "/images/flowtide/shot-home.png", width: 1080, height: 2400 }],
  },
};

/** 从 latest.json 获取最新版本信息，失败时降级为默认值 */
async function getLatestRelease(): Promise<{
  versionName: string;
  downloadUrl: string;
}> {
  try {
    const res = await fetch(
      "https://merrain.cn/download/flowtide/latest.json",
      { next: { revalidate: 3600 } } // ISR：每小时刷新一次
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      versionName: data.versionName || "0.9.5",
      downloadUrl: data.url || "https://merrain.cn/download/flowtide/flowtide-0.9.5.apk",
    };
  } catch {
    // 降级：fetch 失败时用硬编码兜底（至少保证页面不崩）
    return {
      versionName: "0.9.5",
      downloadUrl: "https://merrain.cn/download/flowtide/flowtide-0.9.5.apk",
    };
  }
}

const screenshots = [
  { src: "/images/flowtide/shot-home.png", label: "🍅 番茄钟 + 任务队列", alt: "Flowtide 主界面：番茄钟与任务队列" },
  { src: "/images/flowtide/shot-sound.png", label: "🎧 三档专业声景", alt: "声景面板：深度专注 / 轻度工作 / 休息放松 三档预设" },
  { src: "/images/flowtide/shot-plan.png", label: "🎯 AI 目标拆解", alt: "目标计划：AI 把目标拆成分阶段学习计划" },
  { src: "/images/flowtide/shot-extract.png", label: "📋 AI 日程提取", alt: "AI 日程提取：粘贴日程文字自动识别任务导入番茄钟" },
];

const features = [
  {
    emoji: "🌊",
    title: "心流保护",
    desc: "专注到点不粗暴打断——自动进入心流保护段，状态正好时继续冲，随时一键落地休息。",
  },
  {
    emoji: "🎧",
    title: "专业声景引擎",
    desc: "深度专注 / 轻度工作 / 休息放松三档预设，基底层 + 氛围层双层混音，可单独调节。",
  },
  {
    emoji: "🎵",
    title: "网易云音乐联动",
    desc: "扫码登录播放自己的歌单，进入专注自动压低音乐、突出声景，休息时自然回升。",
  },
  {
    emoji: "🎯",
    title: "AI 目标计划",
    desc: "说出目标和截止日期，AI 拆成分阶段计划，每天的任务自动出现在番茄钟队列。",
  },
  {
    emoji: "📋",
    title: "AI 日程提取",
    desc: "把今日日程文字直接粘贴进来，AI 自动识别任务、时间和认知负荷，一键导入。",
  },
  {
    emoji: "📊",
    title: "精力复盘",
    desc: "精力时段热力图找到你的黄金专注时间，AI 周报把一周的专注讲成一个故事。",
  },
];

const steps = [
  <>
    点击下载按钮获取 APK，若浏览器提示风险请选择<strong>「仍要下载」</strong>（个人开发者应用尚未上架商店，属正常提示）。
  </>,
  <>
    打开安装时如提示未知来源，前往<strong>设置允许「安装未知应用」</strong>后返回继续。
  </>,
  <>
    首次启动会引导你完成<strong>两步保活设置</strong>（允许后台运行 + 开启自启动），到点才能准时提醒。
  </>,
  <>
    想用网易云音乐？进入<strong>「音乐」栏目扫码登录</strong>即可播放你的歌单（cookie 只存本机）。
  </>,
  <>应用内置<strong>自动检查更新</strong>，新版本发布后打开应用即会收到提示。</>,
];

export default async function FlowtidePage() {
  const latest = await getLatestRelease();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ── Hero ── */}
      <header className="mb-16 text-center">
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
          Flowtide
          <span className="ml-2 text-2xl font-medium text-slate-400 dark:text-slate-500">
            心流潮汐
          </span>
        </h1>
        <p className="mb-2 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          让专注与休息像潮汐一样自然涨落的 AI 专注番茄钟
        </p>
        <p className="mb-8 text-sm text-slate-400 dark:text-slate-500">
          心流保护 · 专业声景 · 音乐联动 · AI 计划与复盘
        </p>

        {/* 下载按钮 */}
        <div className="flex flex-col items-center gap-3">
          <a
            href={latest.downloadUrl}
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载 Android 版
          </a>
          <span className="text-sm text-slate-400 dark:text-slate-500">v{latest.versionName} · Android 7.0+ · 约 4 MB</span>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {["🔒 数据仅存本机", "🚫 无广告无统计", "📦 安装包不到 4 MB"].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── 截图展示 ── */}
      <section className="mb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">真机截图</h2>
        <p className="mb-8 text-center text-sm text-slate-400 dark:text-slate-500">
          左右滑动查看更多
        </p>
        <div className="flex gap-5 overflow-x-auto px-2 pb-4 [-webkit-overflow-scrolling:touch] [scroll-snap-type:x_mandatory]">
          {screenshots.map((shot) => (
            <figure
              key={shot.src}
              className="w-[220px] shrink-0 snap-center text-center sm:w-[240px]"
            >
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={540}
                  height={1200}
                  className="block h-auto w-full"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                {shot.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── 功能矩阵 ── */}
      <section className="mb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          为深度专注设计的每一处细节
        </h2>
        <p className="mb-8 text-center text-sm text-slate-400 dark:text-slate-500">
          不打断心流，是 Flowtide 与普通番茄钟最大的不同
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 text-3xl">{f.emoji}</div>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 理念区 ── */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 p-10 text-center dark:from-blue-950/40 dark:to-teal-950/40">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
            🌊 为什么叫「心流潮汐」？
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            专注不该是闹钟式的硬切换。Flowtide
            把一天的专注与休息看作潮起潮落：涨潮时全力以赴，退潮时真正放松。到点不打断、休息不焦虑，让节奏自己流动起来。
          </p>
        </div>
      </section>

      {/* ── 安装说明 ── */}
      <section className="mb-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">📲 安装说明</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-primary-600 dark:bg-blue-900/40 dark:text-primary-400">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 底部 CTA ── */}
      <div className="text-center">
        <a
          href={latest.downloadUrl}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          立即下载 v{latest.versionName}
        </a>
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Flowtide · 数据仅存于本地 (local-first) · 无第三方统计与广告
          <br />
          音乐播放能力基于用户本人网易云账号，应用不存储、不分发任何音频版权内容
        </p>
      </div>
    </div>
  );
}

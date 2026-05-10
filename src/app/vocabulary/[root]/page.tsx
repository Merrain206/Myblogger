import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRootBySlug, getAllRoots, getUngroupedWords } from "@/lib/vocabulary";
import WordCard from "@/components/vocabulary/WordCard";

interface Props {
  params: Promise<{ root: string }>;
}

export async function generateStaticParams() {
  const roots = getAllRoots();
  return roots
    .map((g) => ({ root: g.root }))
    .concat({ root: "__ungrouped__" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { root } = await params;
  if (root === "__ungrouped__") {
    return { title: "独立词汇 - 构词法记单词", description: "无明显构词法的词汇列表" };
  }
  const group = getRootBySlug(root);
  if (!group) return { title: "未找到词根" };
  return {
    title: `${group.root} (${group.rootMeaning}) - 构词法记单词`,
    description: `词根 ${group.root} 相关的 ${group.words.length} 个单词`,
  };
}

export default async function RootDetailPage({ params }: Props) {
  const { root } = await params;

  let words;
  let title: string;
  let subtitle: string;

  if (root === "__ungrouped__") {
    words = getUngroupedWords();
    title = "独立词汇";
    subtitle = "无明显构词法，建议单独记忆";
  } else {
    const group = getRootBySlug(root);
    if (!group) notFound();
    words = group.words;
    title = group.root;
    subtitle = `${group.rootMeaning} · ${words.length} 个单词`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/vocabulary"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回词根列表
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      {words.length > 0 ? (
        <>
          <div className="mb-6">
            <Link
              href={`/vocabulary/flashcard?root=${root}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600"
            >
              用此组单词复习 →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((entry) => (
              <WordCard key={entry.word} entry={entry} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400">该组暂无单词</p>
        </div>
      )}
    </div>
  );
}

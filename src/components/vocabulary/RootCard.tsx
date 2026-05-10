import Link from "next/link";

interface RootCardProps {
  root: string;
  rootMeaning: string;
  wordCount: number;
}

export default function RootCard({ root, rootMeaning, wordCount }: RootCardProps) {
  return (
    <Link
      href={`/vocabulary/${root}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
    >
      <div className="mb-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
        {root}
      </div>
      <div className="mb-1 text-sm text-slate-600 dark:text-slate-400">{rootMeaning}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {wordCount} 个单词
      </div>
    </Link>
  );
}

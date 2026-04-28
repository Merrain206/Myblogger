import Link from "next/link";
import type { Post } from "@/lib/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-700"
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-primary-100 px-2.5 py-0.5 font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {post.category}
        </span>
        <span>{format(new Date(post.date), "yyyy年MM月dd日", { locale: zhCN })}</span>
        <span>&middot;</span>
        <span>{post.readingTime} 分钟阅读</span>
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400">
        {post.title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {post.summary}
      </p>
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

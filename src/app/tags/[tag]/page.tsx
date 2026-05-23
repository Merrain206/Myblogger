import { notFound } from "next/navigation";
import { getPostsByTag, getTags } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) return { title: "标签未找到" };

  return {
    title: `#${tag}`,
    description: `查看所有关于 ${tag} 的文章，共 ${posts.length} 篇。`,
    openGraph: {
      title: `#${tag} | Merrain's Blog`,
      description: `查看所有关于 ${tag} 的文章，共 ${posts.length} 篇。`,
      url: `https://merrain.cn/tags/${encodeURIComponent(tag)}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);

  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <Link
          href="/blog"
          className="mb-4 inline-block text-sm text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-400"
        >
          ← 返回博客
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          <span className="text-primary-500">#</span>{tag}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          共 {posts.length} 篇文章
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

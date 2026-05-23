import { notFound } from "next/navigation";
import { getPostBySlug, getAdjacentPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { MDXComponents } from "@/components/MDXComponents";
import TOC from "@/components/TOC";
import ReadingProgress from "@/components/ReadingProgress";
import GiscusComments from "@/components/GiscusComments";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "未找到文章" };
  const url = `https://merrain.cn/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    keywords: post.tags,
    authors: [{ name: "Merrain" }],
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: "Merrain's Blog",
      title: post.title,
      description: post.summary,
      url,
      publishedTime: post.date,
      modifiedTime: post.date,
      section: post.category,
      tags: post.tags,
      images: post.cover
        ? [{ url: post.cover, width: 1200, height: 630, alt: post.title }]
        : ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: post.cover
        ? [post.cover]
        : ["/opengraph-image"],
    },
  };
}

function extractHeadings(content: string) {
  const regex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w一-鿿\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }
  return headings;
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const { prev, next } = getAdjacentPosts(slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <ReadingProgress />
      <div className="lg:flex lg:gap-10">
        {/* Article */}
        <article className="min-w-0 flex-1">
          {/* Header */}
          <header className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Link
                href="/blog"
                className="text-sm text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-400"
              >
                ← 返回博客
              </Link>
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-slate-100">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {post.category}
              </span>
              <span>{format(new Date(post.date), "yyyy年MM月dd日", { locale: zhCN })}</span>
              <span>&middot;</span>
              <span>{post.readingTime} 分钟阅读</span>
              {post.tags.length > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="flex flex-wrap gap-1">
                    {post.tags.map((t: string) => (
                      <Link
                        key={t}
                        href={`/tags/${encodeURIComponent(t)}`}
                        className="text-primary-500 hover:text-primary-600"
                      >
                        #{t}
                      </Link>
                    ))}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="prose dark:prose-invert">
            <MDXRemote
              source={post.content}
              components={MDXComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [[rehypePrettyCode, { theme: "github-dark", keepBackground: false }]],
                },
              }}
            />
          </div>

          {/* Prev/Next */}
          <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-8 dark:border-slate-700">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="text-xs text-slate-400">← 上一篇</div>
                <div className="mt-1 text-sm font-semibold text-slate-700 group-hover:text-primary-600 dark:text-slate-300">
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 text-right transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="text-xs text-slate-400">下一篇 →</div>
                <div className="mt-1 text-sm font-semibold text-slate-700 group-hover:text-primary-600 dark:text-slate-300">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </nav>
          {/* Comments */}
          <GiscusComments />
        </article>

        {/* TOC */}
        <aside className="w-56 shrink-0">
          <TOC headings={headings} />
        </aside>
      </div>
    </div>
  );
}

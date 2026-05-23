import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { projects } from "@/content/projects";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  const latestPosts = getAllPosts().slice(0, 3);
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
              你好，我是
              <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                {" "}Merrain！
              </span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              热爱编程与探索，在这里分享技术心得、项目经验和生活感悟。
              欢迎浏览我的博客和项目！
            </p>
            <div className="flex gap-3">
              <Link
                href="/blog"
                className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md"
              >
                浏览博客
              </Link>
              <Link
                href="/projects"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                查看项目
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      {latestPosts.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">最新文章</h2>
              <Link href="/blog" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                查看全部 →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="border-t border-slate-200 px-4 py-16 sm:px-6 dark:border-slate-700">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">精选项目</h2>
              <Link href="/projects" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                查看全部 →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.title} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

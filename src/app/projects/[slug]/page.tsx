import { notFound } from "next/navigation";
import Link from "next/link";
import { projects, getProjectBySlug } from "@/content/projects";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "项目未找到" };
  const url = `https://merrain.cn/projects/${project.slug}`;
  return {
    title: project.title,
    description: project.description,
    keywords: project.techStack,
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: "Merrain's Blog",
      title: project.title,
      description: project.description,
      url,
      images: project.imageUrl
        ? [{ url: project.imageUrl, width: 1200, height: 630, alt: project.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: project.imageUrl ? [project.imageUrl] : [],
    },
  };
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Back link */}
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回项目列表
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {project.featured && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              精选项目
            </span>
          )}
        </div>
        <h1 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-slate-100">
          {project.title}
        </h1>
        <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="mt-5 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="mt-5 flex gap-4">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub 源码
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              在线演示
            </a>
          )}
        </div>
      </header>

      {/* Long description */}
      {project.longDescription && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">项目简介</h2>
          <div className="prose dark:prose-invert">
            {project.longDescription.split("\n").map((line, i) => {
              // Simple markdown-like rendering
              if (line.startsWith("## ")) {
                return <h3 key={i} className="mt-6 mb-2 text-lg font-bold text-slate-800 dark:text-slate-200">{line.replace("## ", "")}</h3>;
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return <p key={i} className="mb-2 font-semibold text-slate-700 dark:text-slate-300">{line.replace(/\*\*/g, "")}</p>;
              }
              if (line.startsWith("- **")) {
                const parts = line.replace("- **", "").split("**");
                return (
                  <li key={i} className="mb-1 ml-4 list-disc text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">{parts[0]}</strong>
                    {parts[1] ? <span className="text-slate-600 dark:text-slate-400">{parts[1]}</span> : null}
                  </li>
                );
              }
              if (line.startsWith("- ")) {
                return <li key={i} className="mb-1 ml-4 list-disc text-slate-600 dark:text-slate-400">{line.replace("- ", "")}</li>;
              }
              if (line.startsWith("|") && line.includes("|--")) return null; // skip table header separator
              if (line.startsWith("| ")) {
                const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                if (cells[0] === "**" || cells[0].startsWith("**")) {
                  return (
                    <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                      {cells.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                          {cell.replace(/\*\*/g, "")}
                        </td>
                      ))}
                    </tr>
                  );
                }
                return (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                    {cells.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{cell}</td>
                    ))}
                  </tr>
                );
              }
              if (line.startsWith("```") || line.startsWith("~~~")) return null;
              if (line.trim()) {
                return <p key={i} className="mb-2 leading-relaxed text-slate-600 dark:text-slate-400">{line}</p>;
              }
              return <br key={i} />;
            })}
          </div>
        </section>
      )}

      {/* Features */}
      {project.features && project.features.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">核心功能</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {project.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Architecture */}
      {project.architecture && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">系统架构</h2>
          <div className="prose dark:prose-invert">
            {project.architecture.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h3 key={i} className="mt-6 mb-2 text-lg font-bold text-slate-800 dark:text-slate-200">{line.replace("## ", "")}</h3>;
              }
              if (line.startsWith("```") || line.startsWith("~~~")) return null;
              if (line.startsWith("|--")) return null;
              if (line.startsWith("| ") && i > 0) {
                const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                return (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                    {cells.map((cell, j) => (
                      <td key={j} className="border border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-400">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              }
              if (line.startsWith("| ")) {
                const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                return (
                  <tr key={i} className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {cells.map((cell, j) => (
                      <th key={j} className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300">
                        {cell}
                      </th>
                    ))}
                  </tr>
                );
              }
              if (line.includes("→") || line.includes("]")) {
                return (
                  <div key={i} className="mb-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {line}
                  </div>
                );
              }
              if (line.trim()) {
                return <p key={i} className="mb-2 leading-relaxed text-slate-600 dark:text-slate-400">{line}</p>;
              }
              return <br key={i} />;
            })}
          </div>
          {/* Wrap table rows in a table */}
          {project.architecture.includes("| ") && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {project.architecture.split("\n").filter((line) => line.startsWith("| ")).map((line, i) => {
                    const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                    if (line.includes("--")) return null;
                    const isHeader = i === 0;
                    return (
                      <tr key={i} className={`border-b border-slate-200 dark:border-slate-700 ${isHeader ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                        {cells.map((cell, j) => {
                          const Tag = (i === 0 && j === 0) ? "th" : "td";
                          return (
                            <Tag key={j} className={`border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 ${isHeader ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                              {cell}
                            </Tag>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

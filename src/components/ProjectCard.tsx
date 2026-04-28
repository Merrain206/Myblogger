import Link from "next/link";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-700"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-primary-600 dark:text-slate-100">
          {project.title}
        </h3>
        {project.featured && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            精选
          </span>
        )}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {project.description}
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {project.techStack.map((tech) => (
          <span
            key={tech}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            {tech}
          </span>
        ))}
      </div>
      <div className="flex gap-4">
        {project.githubUrl && (
          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            源码
          </span>
        )}
        {project.demoUrl && (
          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            演示
          </span>
        )}
      </div>
    </Link>
  );
}

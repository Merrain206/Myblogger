import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/content/projects";

export const metadata = {
  title: "项目",
  description: "我参与和构建的项目。",
};

export default function ProjectsPage() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <h1 className="mb-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">项目</h1>
        <p className="text-slate-500 dark:text-slate-400">
          我参与和构建的项目，共 {projects.length} 个。
        </p>
      </div>

      {featured.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-5 text-lg font-semibold text-slate-700 dark:text-slate-300">精选项目</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h2 className="mb-5 text-lg font-semibold text-slate-700 dark:text-slate-300">其他项目</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

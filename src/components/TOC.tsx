"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TOC({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          目录
        </h4>
        <ul className="space-y-1.5 border-l border-slate-200 dark:border-slate-700">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block border-l-2 pl-3 text-sm transition-colors ${
                  h.id === activeId
                    ? "border-primary-400 text-primary-600 dark:border-primary-500 dark:text-primary-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                } ${h.level === 3 ? "ml-3" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

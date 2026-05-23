"use client";

import Giscus from "@giscus/react";
import { useState, useEffect } from "react";

function useGiscusTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const getTheme = () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light";

    setTheme(getTheme());

    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export default function GiscusComments() {
  const theme = useGiscusTheme();

  return (
    <div className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-700">
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">
        评论
      </h2>
      <Giscus
        id="comments"
        repo="Merrain206/Myblogger"
        repoId="R_kgDOSO7XDw"
        category="Announcements"
        categoryId="DIC_kwDOSO7XD84C88cH"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}

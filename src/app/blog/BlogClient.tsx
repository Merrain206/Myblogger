"use client";

import { useState, useMemo } from "react";
import type { Post } from "@/lib/types";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import TagFilter from "@/components/TagFilter";

export default function BlogClient({
  initialPosts,
  allTags,
}: {
  initialPosts: Post[];
  allTags: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const filteredPosts = useMemo(() => {
    let posts = initialPosts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (activeTag) {
      posts = posts.filter((p) => p.tags.includes(activeTag));
    }

    return posts;
  }, [initialPosts, searchQuery, activeTag]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <h1 className="mb-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">博客</h1>
        <p className="text-slate-500 dark:text-slate-400">
          记录学习、思考和成长，共 {initialPosts.length} 篇文章。
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar onSearch={setSearchQuery} />
        <TagFilter tags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-slate-400">没有找到匹配的文章。</p>
        </div>
      )}
    </div>
  );
}

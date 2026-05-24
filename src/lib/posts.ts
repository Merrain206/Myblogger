import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Fuse from "fuse.js";
import type { Post, PostMeta } from "./types";

const postsDirectory = path.join(process.cwd(), "src/content/posts");

function getReadingTime(content: string): number {
  const charsPerMinute = 500; // 中文阅读速度约 400-600 字/分钟
  // 去除代码块和空白，只计算有效字符
  const text = content
    .replace(/```[\s\S]*?```/g, "") // 去代码块
    .replace(/\s+/g, "");           // 去空白
  return Math.max(1, Math.ceil(text.length / charsPerMinute));
}

function parsePost(fileName: string): Post | null {
  if (!fileName.endsWith(".mdx")) return null;

  const slug = fileName.replace(/\.mdx$/, "");
  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    readingTime: getReadingTime(content),
    title: data.title || slug,
    date: data.date || new Date().toISOString(),
    category: data.category || "其他",
    tags: data.tags || [],
    summary: data.summary || "",
    cover: data.cover,
  };
}

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(postsDirectory);
  const posts = files.map(parsePost).filter((p): p is Post => p !== null);
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): Post | null {
  const fileName = `${slug}.mdx`;
  if (!fs.existsSync(path.join(postsDirectory, fileName))) return null;
  return parsePost(fileName);
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))];
}

export function getTags(): string[] {
  const posts = getAllPosts();
  const allTags = posts.flatMap((p) => p.tags);
  return [...new Set(allTags)];
}

export function searchPosts(query: string): Post[] {
  const posts = getAllPosts();
  const fuse = new Fuse(posts, {
    keys: ["title", "summary", "content", "category", "tags"],
    threshold: 0.4,
    includeScore: true,
  });
  return fuse.search(query).map((r) => r.item);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

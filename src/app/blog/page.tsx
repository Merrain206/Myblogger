import { getAllPosts, getTags } from "@/lib/posts";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "博客",
  description:
    "分享技术心得、项目经验和生活感悟。涵盖前端开发、后端编程、AI 实践和运维知识。",
  keywords: [
    "博客",
    "技术",
    "前端",
    "后端",
    "Python",
    "Next.js",
    "React",
    "五子棋",
    "AI",
    "Linux",
  ],
  openGraph: {
    title: "博客 | Merrain's Blog",
    description:
      "分享技术心得、项目经验和生活感悟。涵盖前端开发、后端编程、AI 实践和运维知识。",
    url: "https://merrain.cn/blog",
  },
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const allTags = getTags();

  return <BlogClient initialPosts={allPosts} allTags={allTags} />;
}

import { getAllPosts, getTags } from "@/lib/posts";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "博客",
  description: "所有文章。",
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const allTags = getTags();

  return <BlogClient initialPosts={allPosts} allTags={allTags} />;
}

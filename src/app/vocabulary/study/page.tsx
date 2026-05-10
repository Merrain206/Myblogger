import type { Metadata } from "next";
import { getAllRoots } from "@/lib/vocabulary";
import StudyClient from "./StudyClient";

export const metadata: Metadata = {
  title: "背诵记忆 - 构词法记单词",
  description: "基于间隔重复的词汇背诵系统，支持断点续传",
};

export default function StudyPage() {
  const roots = getAllRoots();
  return <StudyClient roots={roots} />;
}

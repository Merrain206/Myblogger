import type { Metadata } from "next";
import { getAllRoots } from "@/lib/vocabulary";
import FlashcardClient from "./FlashcardClient";

export const metadata: Metadata = {
  title: "闪卡复习 - 构词法记单词",
  description: "通过闪卡翻转记忆 CET4/CET6 词汇",
};

export default function FlashcardPage() {
  const roots = getAllRoots();
  return <FlashcardClient roots={roots} />;
}

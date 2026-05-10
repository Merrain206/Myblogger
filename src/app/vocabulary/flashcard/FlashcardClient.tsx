"use client";

import { useState, useMemo, useCallback, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { RootGroup, FlashcardItem } from "@/lib/vocabulary-types";
import { getAllFlashcards } from "@/lib/vocabulary";
import FlashCard from "@/components/vocabulary/FlashCard";
import FlashCardControls from "@/components/vocabulary/FlashCardControls";

function FlashcardContent({ roots }: { roots: RootGroup[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRoot = searchParams.get("root") || "all";
  const [selectedRoot, setSelectedRoot] = useState(initialRoot);
  const [randomMode, setRandomMode] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);

  const cards: FlashcardItem[] = useMemo(() => {
    const all =
      selectedRoot === "all"
        ? getAllFlashcards()
        : getAllFlashcards(selectedRoot);
    if (randomMode) {
      const shuffled = [...all];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return all;
  }, [selectedRoot, randomMode]);

  // 切换词根时重置索引
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [selectedRoot, randomMode]);

  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  }, [cards.length]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  }, [cards.length]);

  const handleToggleRandom = useCallback(() => {
    setRandomMode((r) => !r);
  }, []);

  const handleSelectRoot = useCallback(
    (root: string) => {
      setSelectedRoot(root);
      const params = new URLSearchParams(searchParams.toString());
      if (root === "all") params.delete("root");
      else params.set("root", root);
      const qs = params.toString();
      router.replace(`/vocabulary/flashcard${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return;
      if (e.key === " " || e.code === "Space") { e.preventDefault(); handleFlip(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); handleNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFlip, handlePrev, handleNext]);

  const currentCard = cards[index];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/vocabulary"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回词根列表
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">闪卡复习</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          点击卡片翻转查看释义和构词分解 · 空格键翻转 · 方向键切换
        </p>
      </div>

      {cards.length > 0 && currentCard ? (
        <div className="mx-auto max-w-md">
          <FlashCard
            entry={currentCard.word}
            flipped={flipped}
            rootName={currentCard.root}
            rootMeaning={currentCard.rootMeaning}
            onFlip={handleFlip}
          />
          <FlashCardControls
            current={index} total={cards.length} flipped={flipped}
            randomMode={randomMode} roots={roots} selectedRoot={selectedRoot}
            onFlip={handleFlip} onPrev={handlePrev} onNext={handleNext}
            onToggleRandom={handleToggleRandom} onSelectRoot={handleSelectRoot}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400">该组暂无单词</p>
          <Link href="/vocabulary" className="mt-3 inline-block text-sm text-primary-500 hover:text-primary-600">
            返回词根列表
          </Link>
        </div>
      )}
    </div>
  );
}

export default function FlashcardClient({ roots }: { roots: RootGroup[] }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-500">加载中...</div>}>
      <FlashcardContent roots={roots} />
    </Suspense>
  );
}

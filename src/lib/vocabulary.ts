import vocabularyData from "@/data/vocabulary.json";
import type { RootGroup, WordEntry, FlashcardItem } from "./vocabulary-types";

const data = vocabularyData as RootGroup[];

export function getAllRoots(): RootGroup[] {
  return data.filter((g) => g.root !== "__ungrouped__");
}

export function getRootBySlug(slug: string): RootGroup | null {
  return data.find((g) => g.root === slug) || null;
}

export function getAllWords(): WordEntry[] {
  const words: WordEntry[] = [];
  for (const group of data) words.push(...group.words);
  return words;
}

export function getUngroupedWords(): WordEntry[] {
  const group = data.find((g) => g.root === "__ungrouped__");
  return group ? group.words : [];
}

export function getAllFlashcards(rootSlug?: string): FlashcardItem[] {
  const groups = rootSlug ? data.filter((g) => g.root === rootSlug) : data;
  const items: FlashcardItem[] = [];
  for (const group of groups) {
    for (const word of group.words) {
      items.push({
        root: group.root === "__ungrouped__" ? undefined : group.root,
        rootMeaning: group.root === "__ungrouped__" ? undefined : group.rootMeaning,
        word,
      });
    }
  }
  return items;
}

export function searchVocabulary(query: string): FlashcardItem[] {
  if (!query.trim()) return getAllFlashcards();
  const q = query.toLowerCase().trim();
  const results: FlashcardItem[] = [];
  for (const group of data) {
    const rootMatch = group.root.toLowerCase().includes(q) || group.rootMeaning.includes(q);
    for (const word of group.words) {
      if (rootMatch || word.word.toLowerCase().includes(q) || word.meaning.includes(q)) {
        results.push({
          root: group.root === "__ungrouped__" ? undefined : group.root,
          rootMeaning: group.root === "__ungrouped__" ? undefined : group.rootMeaning,
          word,
        });
      }
    }
  }
  return results;
}

export function filterByLevel(items: FlashcardItem[], level: "CET4" | "CET6" | "all"): FlashcardItem[] {
  if (level === "all") return items;
  return items.filter((item) => item.word.level === level);
}

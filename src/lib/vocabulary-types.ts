export interface WordEntry {
  word: string;
  phonetic: string;
  meaning: string;
  level: "CET4" | "CET6";
  root?: string;
  rootMeaning?: string;
  prefix?: string;
  prefixMeaning?: string;
  suffix?: string;
  suffixMeaning?: string;
}

export interface RootGroup {
  root: string;
  rootMeaning: string;
  words: WordEntry[];
}

export interface FlashcardItem {
  root?: string;
  rootMeaning?: string;
  word: WordEntry;
}

export interface VocabularyFilter {
  query: string;
  level: "CET4" | "CET6" | "all";
}

import type { FlashcardItem } from "./vocabulary-types";

// SM-2 间隔重复算法

export interface WordProgress {
  word: string;
  easeFactor: number;    // 难度系数，默认 2.5
  interval: number;       // 间隔天数
  repetitions: number;    // 连续正确次数
  nextReview: string;     // 下次复习日期 ISO
  lastQuality: number;    // 最近一次评分 0-5
  totalReviews: number;   // 总复习次数
  firstReview: string;    // 首次复习日期
  lastReview: string;     // 最近复习日期
}

export interface StudyState {
  words: Record<string, WordProgress>;
  lastStudyDate: string;
  sessionFilter: { root: string; level: string };
  sessionQueue: string[]; // 当前会话单词顺序
  sessionIndex: number;
}

export interface StudyStats {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
  due: number;
  total: number;
}

const STORAGE_PREFIX = "myblogger_study_";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStorageKey(username: string): string {
  return STORAGE_PREFIX + username;
}

export function loadProgress(username: string): StudyState | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(getStorageKey(username));
    if (!raw) return null;
    return JSON.parse(raw) as StudyState;
  } catch {
    return null;
  }
}

export function saveProgress(username: string, state: StudyState): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(getStorageKey(username), JSON.stringify(state));
  } catch {
    // localStorage 满了就静默忽略
  }
}

export function listUsers(): string[] {
  const s = safeStorage();
  if (!s) return [];
  const users: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const key = s.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      users.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return users;
}

export function createWordProgress(word: string): WordProgress {
  return {
    word,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().slice(0, 10),
    lastQuality: 0,
    totalReviews: 0,
    firstReview: "",
    lastReview: "",
  };
}

// SM-2 核心：根据评分更新进度
export function updateWordProgress(
  progress: WordProgress,
  quality: number // 0=忘记 2=困难 3=一般 5=简单
): WordProgress {
  const today = new Date().toISOString().slice(0, 10);
  const p = { ...progress };

  p.totalReviews += 1;
  p.lastQuality = quality;
  p.lastReview = today;

  if (!p.firstReview) {
    p.firstReview = today;
  }

  // SM-2: 更新难度系数
  const newEF =
    p.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  p.easeFactor = Math.max(1.3, newEF);

  if (quality < 3) {
    // 未通过 — 重置
    p.repetitions = 0;
    p.interval = 1;
  } else {
    p.repetitions += 1;
    if (p.repetitions === 1) {
      p.interval = 1;
    } else if (p.repetitions === 2) {
      p.interval = 6;
    } else {
      p.interval = Math.round(p.interval * p.easeFactor);
    }
  }

  const next = new Date();
  next.setDate(next.getDate() + p.interval);
  p.nextReview = next.toISOString().slice(0, 10);

  return p;
}

// 构建背诵队列：到期单词 + 新单词
export function buildStudyQueue(
  cards: FlashcardItem[],
  progressMap: Record<string, WordProgress>,
  limit = 30
): FlashcardItem[] {
  const today = new Date().toISOString().slice(0, 10);

  const dueCards: FlashcardItem[] = [];
  const newCards: FlashcardItem[] = [];

  for (const card of cards) {
    const p = progressMap[card.word.word];
    if (!p || p.totalReviews === 0) {
      newCards.push(card);
    } else if (p.nextReview <= today) {
      dueCards.push(card);
    }
  }

  // 到期优先
  const queue = shuffleArray(dueCards).concat(shuffleArray(newCards));
  return queue.slice(0, limit);
}

export function getStudyStats(
  allWords: FlashcardItem[],
  progressMap: Record<string, WordProgress>
): StudyStats {
  const today = new Date().toISOString().slice(0, 10);
  let learned = 0, learning = 0, reviewing = 0, mastered = 0, due = 0;

  for (const card of allWords) {
    const p = progressMap[card.word.word];
    if (!p || p.totalReviews === 0) {
      learned++;
    } else {
      if (p.interval >= 21 && p.repetitions >= 5) {
        mastered++;
      } else if (p.repetitions >= 3) {
        reviewing++;
      } else {
        learning++;
      }
      if (p.nextReview <= today) {
        due++;
      }
    }
  }

  return {
    new: learned,
    learning,
    reviewing,
    mastered,
    due,
    total: allWords.length,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

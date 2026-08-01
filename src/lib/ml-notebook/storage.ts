/**
 * localStorage 持久化 —— 练习代码自动保存和恢复
 *
 * Key 格式: ml-notebook:v1:{exerciseId}
 * 保存策略: debounce 500ms 自动保存
 */

import type { PersistedNotebook, Exercise } from "./types";

const PREFIX = "ml-notebook:v1:";

function key(exerciseId: string): string {
  return `${PREFIX}${exerciseId}`;
}

/** 读取已保存的笔记 */
export function loadNotebook(exerciseId: string): PersistedNotebook | null {
  try {
    const raw = localStorage.getItem(key(exerciseId));
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedNotebook;
    // 基础校验
    if (!Array.isArray(data.cells)) return null;
    return data;
  } catch {
    return null;
  }
}

/** 保存笔记 */
export function saveNotebook(
  exerciseId: string,
  cells: { id: string; code: string; isModified: boolean }[]
): void {
  try {
    const data: PersistedNotebook = {
      lastOpenedAt: Date.now(),
      cells: cells.map((c) => ({
        id: c.id,
        code: c.code,
        isModified: c.isModified,
      })),
    };
    localStorage.setItem(key(exerciseId), JSON.stringify(data));
  } catch {
    // localStorage 满了或不可用，静默失败
    console.warn("ML Notebook: localStorage 保存失败，可能是存储已满");
  }
}

/** 删除某个练习的保存数据 */
export function clearNotebook(exerciseId: string): void {
  try {
    localStorage.removeItem(key(exerciseId));
  } catch {
    // 静默失败
  }
}

/**
 * 从保存数据恢复 Cell 代码
 * 返回恢复后的代码映射 { cellId: savedCode }
 */
export function restoreCellCodes(
  exercise: Exercise
): Map<string, string> {
  const saved = loadNotebook(exercise.id);
  const codeMap = new Map<string, string>();

  if (!saved) return codeMap;

  for (const savedCell of saved.cells) {
    // 只恢复被用户修改过的 cell
    if (savedCell.isModified && savedCell.code) {
      codeMap.set(savedCell.id, savedCell.code);
    }
  }

  return codeMap;
}

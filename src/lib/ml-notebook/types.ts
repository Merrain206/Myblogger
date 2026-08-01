/** Notebook 练习类型定义 */

/** 代码运行输出项 */
export interface CellOutputItem {
  type: "text" | "image" | "error";
  content: string; // 文本内容或 base64 data URI
}

/** 运行结果 */
export interface RunResult {
  stdout: string;
  stderr: string;
  images: string[];  // base64 PNG data URIs
  error: string | null;
}

/** 练习中的单个 Cell */
export interface ExerciseCell {
  id: string;
  label: string;        // 简短标签，如"导入依赖"
  initialCode: string;  // 初始代码
  hint?: string;        // 可选提示
}

/** 一个练习 */
export interface Exercise {
  id: string;           // "c1-w2-cost-function"
  title: string;        // "代价函数"
  course: string;       // "Course 1: 监督学习"
  week: string;         // "Week 2"
  description: string;  // Markdown 说明
  cells: ExerciseCell[];
}

/** Notebook 中运行时的 Cell 状态 */
export interface CellState {
  id: string;
  code: string;
  outputs: CellOutputItem[];
  status: "idle" | "running" | "done" | "error";
  isModified: boolean;
}

/** localStorage 持久化结构 */
export interface PersistedNotebook {
  lastOpenedAt: number;
  cells: {
    id: string;
    code: string;
    isModified: boolean;
  }[];
}

/** Pyodide 加载状态 */
export type PyodideStatus = "idle" | "loading" | "ready" | "error";

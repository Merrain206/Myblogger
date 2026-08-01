"use client";

import PyodideGate from "@/components/ml-notebook/PyodideGate";
import NotebookShell from "@/components/ml-notebook/NotebookShell";

/**
 * ML 练习本 —— 浏览器内 Python 机器学习练习工具
 *
 * 基于 Pyodide (CPython → WebAssembly) 在浏览器中运行 Python 代码，
 * 预置吴恩达 ML 专项课程的核心练习，支持代码编辑、运行、图表展示。
 */
export default function MLNotebookPage() {
  return (
    <PyodideGate>
      <NotebookShell />
    </PyodideGate>
  );
}

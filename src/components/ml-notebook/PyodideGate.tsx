"use client";

import { useEffect, useState, useCallback } from "react";
import { initPyodide } from "@/lib/ml-notebook/pyodide";
import type { PyodideStatus } from "@/lib/ml-notebook/types";

interface PyodideGateProps {
  children: React.ReactNode;
}

/**
 * Pyodide 加载门控组件
 *
 * 在 Pyodide 就绪前显示加载动画,
 * 就绪后渲染子组件 (NotebookShell),
 * 出错时显示错误提示并允许重试。
 */
export default function PyodideGate({ children }: PyodideGateProps) {
  const [status, setStatus] = useState<PyodideStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const startLoading = useCallback(async () => {
    setStatus("loading");
    setProgress(0);
    setErrorMsg("");

    try {
      await initPyodide((pct) => setProgress(pct));
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "未知错误");
    }
  }, []);

  useEffect(() => {
    startLoading();
  }, [startLoading]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 图标 */}
          <div className="mb-6 inline-flex rounded-2xl bg-primary-50 p-4 dark:bg-primary-900/30">
            <svg className="h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58 1.1-.054 2.176-.13 3.225-.225a48.054 48.054 0 01-1.29-5.602.653.653 0 01.568-.627v0c.357 0 .678.187.962.402.283.215.606.402.963.402 1.035 0 1.875-1.008 1.875-2.25s-.84-2.25-1.875-2.25c-.357 0-.68.128-.963.349-.284.221-.605.401-.962.401v0c-.245 0-.467-.135-.54-.38a48.166 48.166 0 01-1.868-5.222" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            正在加载 Python 环境
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            首次加载约需 10-30 秒，后续访问将使用浏览器缓存
          </p>

          {/* 进度条 */}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {progress < 50 && "正在下载 Pyodide 核心..."}
            {progress >= 50 && progress < 70 && "正在初始化 Python 运行时..."}
            {progress >= 70 && progress < 90 && "正在安装 numpy / matplotlib..."}
            {progress >= 90 && "即将就绪..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex rounded-2xl bg-red-50 p-4 dark:bg-red-900/30">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            环境加载失败
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {errorMsg || "请检查网络连接后重试"}
          </p>
          <button
            onClick={startLoading}
            className="mt-6 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // status === "idle" 或 "ready"
  if (status === "ready") {
    return <>{children}</>;
  }

  // idle 初始态：显示与 loading 相同的界面（会很快触发 startLoading）
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-slate-400">准备中...</p>
    </div>
  );
}

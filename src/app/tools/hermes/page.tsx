"use client";

import { useState, useEffect, useCallback } from "react";

interface ImageInfo {
  name: string;
  size: number;
  mimeType: string;
  mtime: number;
  url: string;
}

export default function HermesPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: string[]; count: number } | null>(null);
  const [syncError, setSyncError] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("hermes-last-sync");
    if (saved) setLastSyncTime(Number(saved));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("yijing-auth");
    if (!token) { setIsCheckingAuth(false); return; }
    fetch("/api/tools/yijing/auth", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.valid) setIsAuthed(true); })
      .catch(() => {})
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const fetchImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      // silent
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) fetchImages();
  }, [isAuthed, fetchImages]);

  async function handleAuth() {
    setAuthError("");
    try {
      const res = await fetch("/api/tools/yijing/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "密码错误" }));
        setAuthError(d.error || "密码错误");
        return;
      }
      const { token } = await res.json();
      sessionStorage.setItem("yijing-auth", token);
      setIsAuthed(true);
    } catch {
      setAuthError("验证失败，请重试");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");
    try {
      const token = sessionStorage.getItem("yijing-auth");
      const res = await fetch("/api/sync-media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.error || "同步失败");
      } else {
        setSyncResult({ synced: data.synced, count: data.count });
        const now = Date.now();
        setLastSyncTime(now);
        localStorage.setItem("hermes-last-sync", String(now));
        fetchImages();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("同步失败:", msg, e);
      setSyncError(`网络错误: ${msg}`);
    } finally {
      setSyncing(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTime(ms: number): string {
    const d = new Date(ms);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="text-center">
          <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hermes 图片同步
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            请输入密码以访问同步功能
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="请输入密码"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          {authError && (
            <p className="text-sm text-red-500">{authError}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            验证
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hermes 图片同步
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            从 Hermes Agent 同步 SVG/Mermaid/ECharts 图表
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              上次同步: {formatTime(lastSyncTime)}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                同步中...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                开始同步
              </>
            )}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <svg className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-700 dark:text-green-400">
            同步完成，共 {syncResult.count} 个文件
          </p>
          <button
            onClick={() => setSyncResult(null)}
            className="ml-auto text-green-400 hover:text-green-600 dark:hover:text-green-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {syncError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">{syncError}</p>
          <button
            onClick={() => setSyncError("")}
            className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loadingImages ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-16 dark:border-slate-600">
          <svg className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            暂无图片，请点击上方按钮同步
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.name}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-700">
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-700">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300" title={img.name}>
                    {img.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatSize(img.size)}
                  </p>
                </div>
                <a
                  href={img.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                  title="新标签页预览"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={img.url}
                  download={img.name}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-500 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                  title="下载"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pyodide 管理器 —— 浏览器内 Python 运行时
 *
 * 使用 CDN 加载 Pyodide (CPython → WebAssembly)，提供：
 * - 单例初始化（幂等，多次调用只加载一次）
 * - stdout/stderr 捕获
 * - matplotlib 图表自动导出为 base64 PNG
 * - numpy + matplotlib 预装
 */

import type { RunResult } from "./types";

/** Pyodide 全局类型声明 */
declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string; stdout?: (msg: string) => void; stderr?: (msg: string) => void }) => Promise<PyodideInstance>;
  }
}

interface PyodideInstance {
  runPython: (code: string) => unknown;
  loadPackage: (names: string | string[]) => Promise<void>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
  pyimport: (name: string) => unknown;
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

let pyodide: PyodideInstance | null = null;
let loading = false;
let loadPromise: Promise<PyodideInstance> | null = null;

/** 注入到 Pyodide 环境的 Python 初始化脚本 */
const PY_INIT_SCRIPT = `
import sys, io, base64, json

# ----- stdout / stderr 捕获 -----
_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf

def _flush_streams():
    """返回 (stdout_text, stderr_text) 并清空缓冲区"""
    out = _stdout_buf.getvalue()
    err = _stderr_buf.getvalue()
    _stdout_buf.truncate(0)
    _stdout_buf.seek(0)
    _stderr_buf.truncate(0)
    _stderr_buf.seek(0)
    return out, err

# ----- matplotlib 捕获 -----
_images = []

def _setup_matplotlib():
    """配置 matplotlib Agg 后端并拦截 plt.show()"""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        _orig_show = plt.show
        def _capture_show(*args, **kwargs):
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            _images.append(base64.b64encode(buf.read()).decode('utf-8'))
            buf.close()
            plt.close('all')
        plt.show = _capture_show
    except ImportError:
        pass  # matplotlib 不可用时静默跳过

def _collect_images():
    """返回所有捕获的图表 base64 列表并清空"""
    global _images
    imgs = list(_images)
    _images = []
    return imgs

_setup_matplotlib()
del _setup_matplotlib
`;

/** 脚本 DOM 节点缓存 */
let scriptEl: HTMLScriptElement | null = null;

/**
 * 动态加载 Pyodide JS 文件
 * 先尝试从全局 scope 获取 loadPyodide，如果没有则动态创建 script 标签
 */
function loadPyodideScript(onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果已经加载过了
    if (window.loadPyodide) return resolve();

    // 检查是否已有正在加载的 script
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PYODIDE_CDN}pyodide.js"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Pyodide 脚本加载失败")));
      return;
    }

    scriptEl = document.createElement("script");
    scriptEl.src = `${PYODIDE_CDN}pyodide.js`;
    scriptEl.async = true;
    scriptEl.onload = () => {
      onProgress?.(50);
      resolve();
    };
    scriptEl.onerror = () => reject(new Error("Pyodide 脚本加载失败，请检查网络连接"));
    document.head.appendChild(scriptEl);
  });
}

/**
 * 初始化 Pyodide 运行时（幂等，多次调用只初始化一次）
 *
 * @param onProgress 进度回调，0-100
 * @returns Pyodide 实例
 */
export async function initPyodide(onProgress?: (pct: number) => void): Promise<PyodideInstance> {
  // 已就绪
  if (pyodide) return pyodide;

  // 正在加载中，等待
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      onProgress?.(5);

      // 1. 加载 Pyodide 脚本
      await loadPyodideScript(onProgress);
      onProgress?.(55);

      if (!window.loadPyodide) {
        throw new Error("Pyodide 加载异常：loadPyodide 不可用");
      }

      // 2. 初始化 Pyodide 核心
      onProgress?.(60);
      pyodide = await window.loadPyodide({
        indexURL: PYODIDE_CDN,
        stdout: (msg: string) => void 0, // 由我们的 Python 层处理
        stderr: (msg: string) => void 0,
      });
      onProgress?.(70);

      // 3. 注入 stdout/stderr/matplotlib 捕获脚本
      pyodide.runPython(PY_INIT_SCRIPT);
      onProgress?.(75);

      // 4. 预装 numpy + matplotlib
      await pyodide.loadPackage(["micropip"]);
      const micropip = pyodide.pyimport("micropip") as { install: (pkgs: string[]) => Promise<void> };
      await micropip.install(["numpy", "matplotlib"]);
      onProgress?.(95);

      // 5. 在已安装 matplotlib 后重新运行初始化脚本
      pyodide.runPython(PY_INIT_SCRIPT);
      onProgress?.(100);

      return pyodide;
    } catch (err) {
      loading = false;
      loadPromise = null;
      pyodide = null;
      throw err;
    }
  })();

  return loadPromise;
}

/**
 * 运行 Python 代码，返回 stdout / stderr / 图表 / 错误
 * 必须在 initPyodide() 完成后调用
 */
export function runPython(code: string): RunResult {
  if (!pyodide) {
    throw new Error("Pyodide 未初始化，请先调用 initPyodide()");
  }

  let stdout = "";
  let stderr = "";
  let images: string[] = [];
  let error: string | null = null;

  try {
    // 执行用户代码
    pyodide.runPython(code);

    // 收集 stdout / stderr
    const [out, err] = pyodide.runPython("_flush_streams()") as [string, string];
    stdout = out;
    stderr = err;

    // 收集 matplotlib 图表
    images = pyodide.runPython("_collect_images()") as string[];
  } catch (e: unknown) {
    // 代码执行出错，仍然收集已有的 stdout/stderr/images
    try {
      const [out, err] = pyodide.runPython("_flush_streams()") as [string, string];
      stdout = out;
      stderr = err;
      images = pyodide.runPython("_collect_images()") as string[];
    } catch {
      // 静默处理清理错误
    }

    if (e instanceof Error) {
      // 清理 Python traceback，去掉前面几行 Pyodide 内部信息
      error = e.message;
    } else {
      error = String(e);
    }
  }

  return { stdout, stderr, images, error };
}

/** 是否已就绪 */
export function isReady(): boolean {
  return pyodide !== null;
}

/** 重置 Pyodide（仅用于测试/调试） */
export function reset(): void {
  pyodide = null;
  loading = false;
  loadPromise = null;
  if (scriptEl) {
    scriptEl.remove();
    scriptEl = null;
  }
}

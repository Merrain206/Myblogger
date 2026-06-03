"use client";

import { useState, useEffect } from "react";
import type { YaoValue, PaipanResult, InterpretResult } from "@/lib/yijing/types";
import { paipan } from "@/lib/yijing/paipan";
import { getProvinces, getCitiesByProvince } from "@/lib/yijing/data/regions";
import YaoSelector from "@/components/yijing/YaoSelector";
import PaipanDisplay from "@/components/yijing/PaipanDisplay";
import AIInterpret from "@/components/yijing/AIInterpret";
import ArchivePanel from "@/components/yijing/ArchivePanel";

const DEFAULT_YAO: YaoValue[] = [7, 7, 7, 7, 7, 7];

export default function YijingPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showHint, setShowHint] = useState(false);

  // 挂载时检查 sessionStorage 中是否有有效 token
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

  const [question, setQuestion] = useState("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [yaoValues, setYaoValues] = useState<YaoValue[]>(DEFAULT_YAO);

  const [paipanResult, setPaipanResult] = useState<PaipanResult | null>(null);
  const [interpretResult, setInterpretResult] = useState<InterpretResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState("");

  const provinces = getProvinces();
  const cities = province ? getCitiesByProvince(province) : [];

  const allSelected = question.trim() && city && yaoValues.every((v) => v != null);

  function handlePaipan() {
    if (!allSelected) return;
    const result = paipan({
      question: question.trim(),
      gender,
      yaoValues: yaoValues as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue],
      province,
      city,
      dateTime: dateTime || undefined,
    });
    setPaipanResult(result);
    setInterpretResult(null);
    setInterpretError("");
  }

  function handleSave() {
    if (!allSelected) return;
    // 如果还没排盘，先排盘；否则直接用已有结果
    const result = paipanResult ?? paipan({
      question: question.trim(),
      gender,
      yaoValues: yaoValues as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue],
      province,
      city,
      dateTime: dateTime || undefined,
    });
    if (!paipanResult) setPaipanResult(result);
    const STORAGE_KEY = "yijing-archives";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const archives = raw ? JSON.parse(raw) : [];
      const record = {
        id: Date.now().toString(36),
        timestamp: Date.now(),
        question: question.trim(),
        gender,
        paipan: result,
        interpret: interpretResult ?? null,
      };
      archives.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
      window.dispatchEvent(new Event("yijing-archive-updated"));
      // 同步到服务端（静默降级）
      fetch("/api/tools/yijing/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      }).catch(() => {});
    } catch {
      // localStorage 满时静默失败
    }
  }

  async function handleInterpret() {
    if (!paipanResult) return;
    setIsInterpreting(true);
    setInterpretError("");
    try {
      const res = await fetch("/api/tools/yijing/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          gender,
          paipan: paipanResult,
        }),
      });
      if (!res.ok) throw new Error(`API 错误: ${res.status}`);
      const data: InterpretResult = await res.json();
      setInterpretResult(data);
    } catch (err) {
      setInterpretError(err instanceof Error ? err.message : "解卦请求失败");
    } finally {
      setIsInterpreting(false);
    }
  }

  // 密码门控：加载中 / 未认证
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A96E] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
          周易六爻排盘解卦
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          请输入访问密码
        </p>

        <div className="w-full space-y-4">
          <input
            type="password"
            value={authPassword}
            onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
            placeholder="输入密码"
            autoFocus
            className="w-full rounded-xl border border-[#D4C5A0]/60 bg-white px-4 py-3 text-center text-slate-800 placeholder-slate-400 focus:border-[#C9A96E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />

          {authError && (
            <p className="text-center text-sm text-red-500">{authError}</p>
          )}

          <button
            type="button"
            onClick={handleAuth}
            disabled={!authPassword.trim()}
            className="w-full rounded-xl bg-[#C9A96E] py-3 text-sm font-semibold text-white transition-all hover:bg-[#B8956E] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#B8956E] dark:hover:bg-[#A07D5E]"
          >
            验证
          </button>

          <p className="text-center">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
            >
              {showHint ? "隐藏提示" : "忘记密码？"}
            </button>
          </p>
          {showHint && (
            <p className="text-center text-sm font-mono text-slate-500 dark:text-slate-400">
              m3r1n+b2gu2
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          周易六爻排盘解卦
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          诚心默念所问之事，以三枚铜钱摇卦六次，逐一录入
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* 左侧：输入区 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#D4C5A0]/60 bg-[#FDF8F0] p-5 dark:border-slate-600 dark:bg-slate-800/60">
            <h2 className="text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E] mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">所问何事</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="例如：本次跳槽是否顺利？"
                  className="w-full rounded-lg border border-[#D4C5A0]/60 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#C9A96E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">性别</label>
                <div className="flex gap-3">
                  {(["男", "女"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-all ${
                        gender === g
                          ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#8B6914] dark:border-[#B8956E] dark:text-[#C9A96E]"
                          : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">省份</label>
                  <select
                    value={province}
                    onChange={(e) => { setProvince(e.target.value); setCity(""); }}
                    className="w-full rounded-lg border border-[#D4C5A0]/60 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#C9A96E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">选择省份</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">城市</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province}
                    className="w-full rounded-lg border border-[#D4C5A0]/60 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#C9A96E] focus:outline-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">选择城市</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  日期时间（可选，留空为当前时间）
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full rounded-lg border border-[#D4C5A0]/60 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#C9A96E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#D4C5A0]/60 bg-[#FDF8F0] p-5 dark:border-slate-600 dark:bg-slate-800/60">
            <YaoSelector yaoValues={yaoValues} onChange={setYaoValues} />
          </div>

          <button
            type="button"
            onClick={handlePaipan}
            disabled={!allSelected}
            className="w-full rounded-xl bg-[#C9A96E] py-3 text-sm font-semibold text-white transition-all hover:bg-[#B8956E] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#B8956E] dark:hover:bg-[#A07D5E]"
          >
            开始排盘解卦
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!allSelected}
            className="w-full rounded-xl border border-[#C9A96E] bg-white py-3 text-sm font-semibold text-[#8B6914] transition-all hover:bg-[#C9A96E]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#B8956E] dark:bg-slate-800 dark:text-[#C9A96E] dark:hover:bg-[#B8956E]/15"
          >
            保存结果
          </button>

          {/* 隐私保护与免责声明 */}
          <div className="rounded-xl border border-[#D4C5A0]/60 bg-[#FDF8F0] p-4 text-xs text-slate-500 leading-relaxed dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            <p className="font-semibold text-[#8B6914] dark:text-[#C9A96E] mb-2">隐私保护 & 免责声明</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>您的摇卦数据将保存在浏览器本地和服务器，仅用于存档查看，不会用于任何其他目的。</li>
              <li>AI 解卦结果由 DeepSeek 大模型生成，仅供娱乐参考，不构成任何形式的专业建议（包括但不限于法律、医疗、投资等）。</li>
              <li>命运掌握在自己手中，请理性看待解卦内容。</li>
            </ul>
          </div>
        </div>

        {/* 右侧：结果区 */}
        <div className="lg:col-span-3">
          {paipanResult ? (
            <div className="space-y-6">
              <PaipanDisplay result={paipanResult} />

              {!interpretResult && !isInterpreting && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleInterpret}
                    className="rounded-xl border border-[#C9A96E] bg-white px-8 py-3 text-sm font-semibold text-[#8B6914] transition-all hover:bg-[#C9A96E]/10 dark:border-[#B8956E] dark:bg-slate-800 dark:text-[#C9A96E] dark:hover:bg-[#B8956E]/15"
                  >
                    AI 多方解卦
                  </button>
                </div>
              )}

              {isInterpreting && (
                <div className="rounded-xl border border-[#D4C5A0]/60 bg-[#FDF8F0] p-8 text-center dark:border-slate-600 dark:bg-slate-800/60">
                  <div className="mb-3 mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#C9A96E] border-t-transparent" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    AI 正在从多个角度分析卦象，请稍候...
                  </p>
                </div>
              )}

              {interpretError && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {interpretError}
                </div>
              )}

              {interpretResult && <AIInterpret result={interpretResult} />}

              {paipanResult && <ArchivePanel />}
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-[#D4C5A0]/60 bg-[#FDF8F0]/50 text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-800/30">
              请在左侧填写信息并选择六爻后，点击「开始排盘解卦」
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

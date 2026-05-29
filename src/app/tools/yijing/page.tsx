"use client";

import { useState } from "react";
import type { YaoValue, PaipanResult, InterpretResult } from "@/lib/yijing/types";
import { paipan } from "@/lib/yijing/paipan";
import { getProvinces, getCitiesByProvince } from "@/lib/yijing/data/regions";
import YaoSelector from "@/components/yijing/YaoSelector";
import PaipanDisplay from "@/components/yijing/PaipanDisplay";
import AIInterpret from "@/components/yijing/AIInterpret";

const DEFAULT_YAO: YaoValue[] = [7, 7, 7, 7, 7, 7];

export default function YijingPage() {
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

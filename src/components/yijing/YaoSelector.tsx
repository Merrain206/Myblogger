"use client";

import type { YaoValue } from "@/lib/yijing/types";

const YAO_OPTIONS: { value: YaoValue; label: string; desc: string }[] = [
  { value: 6, label: "老阴 ⚋×", desc: "阴爻动" },
  { value: 7, label: "少阳 ⚊", desc: "阳爻静" },
  { value: 8, label: "少阴 ⚋", desc: "阴爻静" },
  { value: 9, label: "老阳 ⚊○", desc: "阳爻动" },
];

const POSITION_LABELS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

interface YaoSelectorProps {
  yaoValues: YaoValue[];
  onChange: (values: YaoValue[]) => void;
}

export default function YaoSelector({ yaoValues, onChange }: YaoSelectorProps) {
  function handleSelect(index: number, value: YaoValue) {
    const next = [...yaoValues] as YaoValue[];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <p className="text-sm text-[#C9A96E] dark:text-[#B8956E]">
          自下而上，逐爻选择摇卦结果
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          心诚则灵 · 以实体铜钱摇卦，于此录入
        </p>
      </div>

      {[...POSITION_LABELS].reverse().map((label, displayIdx) => {
        const actualIdx = 5 - displayIdx;
        const selected = yaoValues[actualIdx];

        return (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-[#D4C5A0]/60 bg-[#FDF8F0] px-4 py-3 transition-colors dark:border-slate-600 dark:bg-slate-800/60"
          >
            <span className="w-12 shrink-0 text-center font-serif text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E]">
              {label}
            </span>
            <div className="flex gap-2">
              {YAO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(actualIdx, opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                    selected === opt.value
                      ? opt.value === 6 || opt.value === 9
                        ? "border-[#C06040] bg-[#C06040]/10 text-[#C06040] dark:border-[#D08060] dark:bg-[#D08060]/15 dark:text-[#D08060]"
                        : "border-[#C9A96E] bg-[#C9A96E]/15 text-[#8B6914] dark:border-[#B8956E] dark:bg-[#B8956E]/15 dark:text-[#C9A96E]"
                      : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="text-center mt-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          ↑ 上爻 &nbsp;|&nbsp; 初爻 ↓
        </p>
      </div>
    </div>
  );
}

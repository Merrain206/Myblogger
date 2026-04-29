"use client";

import { useEffect, useState } from "react";

const NIGHT_STEPS = ["天黑请闭眼...", "狼人正在行动...", "预言家正在查验...", "女巫正在抉择..."];

export default function NightPhaseOverlay({
  round,
  visible,
}: {
  round: number;
  visible: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, NIGHT_STEPS.length - 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [visible, round]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-6xl mb-6 animate-pulse">🌙</div>
        <div className="text-2xl font-bold text-white mb-2">
          第 {round} 夜
        </div>
        <div className="text-lg text-slate-300 animate-pulse">
          {NIGHT_STEPS[step]}
        </div>
        <div className="mt-6 flex justify-center gap-1.5">
          {NIGHT_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? "bg-white w-4" : "bg-slate-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

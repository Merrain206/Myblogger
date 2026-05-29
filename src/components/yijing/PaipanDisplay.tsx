import type { PaipanResult } from "@/lib/yijing/types";
import { TRIGRAM_BY_NAME } from "@/lib/yijing/data/bagua";

function ShiYingMarker({ position, shi, ying }: { position: number; shi: number; ying: number }) {
  if (position === shi) return <span className="text-[#C06040] font-semibold">世</span>;
  if (position === ying) return <span className="text-[#C9A96E] font-semibold">应</span>;
  return null;
}

export default function PaipanDisplay({ result }: { result: PaipanResult }) {
  const { title, gender, ganzhi, shenSha, kongWang, baseHexagram, changedHexagram, yaoDetails } = result;
  const upperSym = TRIGRAM_BY_NAME[baseHexagram.upperTrigram]?.symbol ?? "";
  const lowerSym = TRIGRAM_BY_NAME[baseHexagram.lowerTrigram]?.symbol ?? "";

  return (
    <div className="space-y-6 font-serif">
      {/* 标题区 */}
      <div className="text-center border-b border-[#D4C5A0]/60 pb-4 dark:border-slate-600">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {title || "占卦"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {gender === "男" ? "乾造" : "坤造"} · {ganzhi.gregorianDate}
        </p>
      </div>

      {/* 四柱 */}
      <div className="rounded-lg border border-[#D4C5A0]/60 bg-[#FDF8F0] px-5 py-4 dark:border-slate-600 dark:bg-slate-800/60">
        <h3 className="text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E] mb-3">四柱</h3>
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          {[
            { label: "年柱", value: ganzhi.yearPillar },
            { label: "月柱", value: ganzhi.monthPillar },
            { label: "日柱", value: ganzhi.dayPillar },
            { label: "时柱", value: ganzhi.hourPillar },
          ].map((p) => (
            <div key={p.label}>
              <div className="text-xs text-slate-400 dark:text-slate-500">{p.label}</div>
              <div className="mt-1 font-mono text-base text-slate-800 dark:text-slate-100">{p.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <div>农历：{ganzhi.lunarDate}</div>
          <div>节气：{ganzhi.solarTerm || "—"}</div>
          <div>空亡：{kongWang || "—"}</div>
          <div>真太阳时：{ganzhi.trueSolarDate}</div>
        </div>
      </div>

      {/* 卦象展示 */}
      <div className="grid grid-cols-2 gap-4">
        <HexagramCard hexagram={baseHexagram} upperSym={upperSym} lowerSym={lowerSym} />
        {changedHexagram ? (
          <HexagramCard
            hexagram={changedHexagram}
            upperSym={TRIGRAM_BY_NAME[changedHexagram.upperTrigram]?.symbol ?? ""}
            lowerSym={TRIGRAM_BY_NAME[changedHexagram.lowerTrigram]?.symbol ?? ""}
            isChanged
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[#D4C5A0]/60 bg-[#FDF8F0]/50 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-800/30">
            无动爻，不变卦
          </div>
        )}
      </div>

      {/* 卦辞 */}
      <div className="rounded-lg border border-[#D4C5A0]/60 bg-[#FDF8F0] px-5 py-4 dark:border-slate-600 dark:bg-slate-800/60">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-[#8B6914] dark:text-[#C9A96E]">卦辞：</span>
          {baseHexagram.guaCi.original}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {baseHexagram.guaCi.modern}
        </p>
      </div>

      {/* 六爻详情表 */}
      <div className="rounded-lg border border-[#D4C5A0]/60 bg-white dark:border-slate-600 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D4C5A0]/60 bg-[#FDF8F0] dark:border-slate-600 dark:bg-slate-800/60">
                <th className="px-3 py-2 text-left text-[#8B6914] dark:text-[#C9A96E]">爻位</th>
                <th className="px-3 py-2 text-left text-[#8B6914] dark:text-[#C9A96E]">爻</th>
                <th className="px-3 py-2 text-left text-[#8B6914] dark:text-[#C9A96E]">六亲</th>
                <th className="px-3 py-2 text-left text-[#8B6914] dark:text-[#C9A96E]">五行</th>
                <th className="px-3 py-2 text-left text-[#8B6914] dark:text-[#C9A96E]">世应</th>
              </tr>
            </thead>
            <tbody>
              {[...yaoDetails].reverse().map((yao) => (
                <tr
                  key={yao.position}
                  className={`border-b border-slate-100 dark:border-slate-700 ${
                    yao.isMoving ? "bg-[#C06040]/5 dark:bg-[#D08060]/10" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                    {["初爻","二爻","三爻","四爻","五爻","上爻"][yao.position - 1]}
                  </td>
                  <td className="px-3 py-2">
                    <span className={yao.isMoving ? "text-[#C06040] font-semibold" : "text-slate-600 dark:text-slate-400"}>
                      {yao.label.split(" ")[1]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{yao.liuQin}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{yao.wuXing}</td>
                  <td className="px-3 py-2">
                    <ShiYingMarker
                      position={yao.position}
                      shi={baseHexagram.shiYaoPosition}
                      ying={baseHexagram.yingYaoPosition}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 动爻辞 */}
      {result.movingYaoPositions.length > 0 && (
        <div className="rounded-lg border border-[#D4C5A0]/60 bg-[#FDF8F0] px-5 py-4 dark:border-slate-600 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E] mb-3">动爻辞</h3>
          {result.movingYaoPositions.map((pos) => {
            const ci = baseHexagram.yaoCi[pos - 1];
            return (
              <div key={pos} className="mb-3 last:mb-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {ci.label}：「{ci.original}」
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ci.modern}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 神煞 */}
      {shenSha.length > 0 && (
        <div className="rounded-lg border border-[#D4C5A0]/60 bg-[#FDF8F0] px-5 py-4 dark:border-slate-600 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold text-[#8B6914] dark:text-[#C9A96E] mb-3">神煞</h3>
          <div className="flex flex-wrap gap-2">
            {shenSha.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1 rounded-full border border-[#C9A96E]/40 bg-white px-3 py-1 text-xs text-slate-600 dark:border-[#B8956E]/40 dark:bg-slate-700 dark:text-slate-300"
                title={s.description}
              >
                <span className="font-semibold text-[#8B6914] dark:text-[#C9A96E]">{s.name}</span>
                <span>{s.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HexagramCard({
  hexagram,
  upperSym,
  lowerSym,
  isChanged,
}: {
  hexagram: { name: string; shortName: string; palace: string; palaceElement: string };
  upperSym: string;
  lowerSym: string;
  isChanged?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-5 text-center transition-all ${
        isChanged
          ? "border-[#C06040]/40 bg-[#FDF8F0] dark:border-[#D08060]/30 dark:bg-slate-800/60"
          : "border-[#D4C5A0]/60 bg-[#FDF8F0] dark:border-slate-600 dark:bg-slate-800/60"
      }`}
    >
      <div className="text-4xl mb-2">
        <span className="block">{upperSym}</span>
        <span className="block">{lowerSym}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {hexagram.name}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {hexagram.palace} · 属{hexagram.palaceElement}
      </p>
      {isChanged && (
        <span className="mt-2 inline-block rounded-full border border-[#C06040]/40 px-2 py-0.5 text-xs text-[#C06040] dark:text-[#D08060]">
          变卦
        </span>
      )}
    </div>
  );
}

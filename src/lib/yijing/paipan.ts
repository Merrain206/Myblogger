import type { PaipanInput, PaipanResult, TrigramName, YaoValue } from "./types";
import { getCityInfo } from "./data/regions";
import { getGanzhiCalendar } from "./calendar";
import { calculateShenSha } from "./shensha-calc";
import { buildYaoDetails, getMovingYaoPositions, getChangedYaoValues } from "./liuqin";
import { HEXAGRAMS } from "./data/bagua";
import { getKongWang } from "./data/shensha";

const BINARY_TO_TRIGRAM: Record<number, TrigramName> = {
  0: "坤", 1: "艮", 2: "坎", 3: "巽",
  4: "震", 5: "离", 6: "兑", 7: "乾",
};

/**
 * 从六爻算出上卦/下卦名称：下三爻(初/二/三)为下卦，上三爻(四/五/上)为上卦
 * 八卦三位编码：最高位=初爻/四爻，最低位=三爻/上爻（与 TRIGRAMS.binary 一致）
 * 例：震☳(阳-阴-阴) = 初阳(bit2=4) + 二阴(bit1=0) + 三阴(bit0=0) = 4
 */
function getTrigrams(yaoValues: readonly YaoValue[]): { lower: TrigramName; upper: TrigramName } {
  function trigramBinary(startIdx: number): number {
    let b = 0;
    for (let i = 0; i < 3; i++) {
      const v = yaoValues[startIdx + i];
      if (v === 7 || v === 9) b |= (1 << (2 - i)); // bit2=初/四, bit1=二/五, bit0=三/上
    }
    return b;
  }
  return {
    lower: BINARY_TO_TRIGRAM[trigramBinary(0)],
    upper: BINARY_TO_TRIGRAM[trigramBinary(3)],
  };
}

function findHexagram(lower: TrigramName, upper: TrigramName) {
  return HEXAGRAMS.find((h) => h.lowerTrigram === lower && h.upperTrigram === upper);
}

export function paipan(input: PaipanInput): PaipanResult {
  const { question, gender, yaoValues, province, city, dateTime } = input;

  // 1. 获取城市经纬度
  const cityInfo = getCityInfo(city);
  const longitude = cityInfo?.longitude ?? 116.40;
  const date = dateTime ?? new Date().toISOString();

  // 2. 四柱推算
  const ganzhi = getGanzhiCalendar(date, longitude);

  // 3. 排卦 — 通过上下卦查找，比 binaryPattern 更可靠
  const trigrams = getTrigrams(yaoValues);
  const baseHexagram = findHexagram(trigrams.lower, trigrams.upper);
  if (!baseHexagram) {
    throw new Error(`无法匹配卦象：${trigrams.upper}上${trigrams.lower}下`);
  }

  const movingYaoPositions = getMovingYaoPositions(yaoValues);
  let changedHexagram = null;
  if (movingYaoPositions.length > 0) {
    const changedYaos = getChangedYaoValues(yaoValues);
    const changedTrigrams = getTrigrams(changedYaos);
    changedHexagram = findHexagram(changedTrigrams.lower, changedTrigrams.upper) ?? null;
  }

  // 4. 六亲配爻
  const yaoDetails = buildYaoDetails(yaoValues, baseHexagram);

  // 5. 神煞
  const shenSha = calculateShenSha(
    ganzhi.dayGan, ganzhi.dayZhi, ganzhi.yearZhi, ganzhi.monthZhi,
    ganzhi.yearPillar, ganzhi.monthPillar, ganzhi.dayPillar, ganzhi.hourPillar,
  );

  // 6. 空亡
  const kongWang = getKongWang(ganzhi.dayGan, ganzhi.dayZhi);

  return {
    title: question,
    gender,
    ganzhi,
    shenSha,
    kongWang,
    baseHexagram,
    changedHexagram,
    movingYaoPositions,
    yaoDetails,
  };
}

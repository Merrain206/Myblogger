import type { YaoValue, YaoDetail, YinYang, WuXing, LiuQin, HexagramData } from "./types";
import { getNajiaWuXing } from "./data/bagua";

const WUXING_RELATIONS: Record<WuXing, Record<WuXing, LiuQin>> = {
  金: { 金: "兄弟", 木: "妻财", 水: "子孙", 火: "官鬼", 土: "父母" },
  木: { 木: "兄弟", 土: "妻财", 火: "子孙", 金: "官鬼", 水: "父母" },
  水: { 水: "兄弟", 火: "妻财", 木: "子孙", 土: "官鬼", 金: "父母" },
  火: { 火: "兄弟", 金: "妻财", 土: "子孙", 水: "官鬼", 木: "父母" },
  土: { 土: "兄弟", 水: "妻财", 金: "子孙", 木: "官鬼", 火: "父母" },
};

const YAO_LABELS_6 = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
const YAO_LABELS_BY_VALUE: Record<YaoValue, string> = {
  6: "老阴 ⚋×",
  7: "少阳 ⚊",
  8: "少阴 ⚋",
  9: "老阳 ⚊○",
};

function getYinYang(v: YaoValue): YinYang {
  return v === 6 || v === 8 ? "yin" : "yang";
}

function isMoving(v: YaoValue): boolean {
  return v === 6 || v === 9;
}

function getYaoLabel(v: YaoValue): string {
  return YAO_LABELS_BY_VALUE[v];
}

function getLiuQin(palaceElement: WuXing, yaoWuXing: WuXing): LiuQin {
  return WUXING_RELATIONS[palaceElement]?.[yaoWuXing] ?? "兄弟";
}

export function buildYaoDetails(
  yaoValues: YaoValue[],
  hexagram: HexagramData,
): YaoDetail[] {
  const palaceElement = hexagram.palaceElement;

  return yaoValues.map((value, i) => {
    const position = i + 1;
    // 纳甲五行：下卦管初爻到三爻，上卦管四爻到上爻
    const najiaRow = getNajiaWuXing(hexagram.lowerTrigram, hexagram.upperTrigram);
    const yaoWuXing = najiaRow[i];

    return {
      position,
      value,
      yinYang: getYinYang(value),
      label: `${YAO_LABELS_6[i]} ${getYaoLabel(value)}`,
      isMoving: isMoving(value),
      wuXing: yaoWuXing,
      liuQin: getLiuQin(palaceElement, yaoWuXing),
    };
  });
}

export function getMovingYaoPositions(yaoValues: YaoValue[]): number[] {
  return yaoValues.reduce<number[]>((acc, v, i) => {
    if (isMoving(v)) acc.push(i + 1);
    return acc;
  }, []);
}

export function getChangedYaoValues(yaoValues: YaoValue[]): YaoValue[] {
  return yaoValues.map((v) => {
    if (v === 6) return 7;
    if (v === 9) return 8;
    return v;
  }) as YaoValue[];
}

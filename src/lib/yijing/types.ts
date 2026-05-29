// === 基础类型 ===

/** 爻的四种数值 */
export type YaoValue = 6 | 7 | 8 | 9;

/** 爻的阴阳分类 */
export type YinYang = "yin" | "yang";

/** 五行 */
export type WuXing = "金" | "木" | "水" | "火" | "土";

/** 六亲 */
export type LiuQin = "父母" | "兄弟" | "妻财" | "官鬼" | "子孙";

/** 十天干 */
export type TianGan =
  | "甲" | "乙" | "丙" | "丁" | "戊"
  | "己" | "庚" | "辛" | "壬" | "癸";

/** 十二地支 */
export type DiZhi =
  | "子" | "丑" | "寅" | "卯" | "辰" | "巳"
  | "午" | "未" | "申" | "酉" | "戌" | "亥";

/** 八卦名称 */
export type TrigramName =
  | "乾" | "兑" | "离" | "震"
  | "巽" | "坎" | "艮" | "坤";

// === 爻相关 ===

export interface YaoDetail {
  position: number;
  value: YaoValue;
  yinYang: YinYang;
  label: string;
  isMoving: boolean;
  wuXing: WuXing;
  liuQin: LiuQin;
}

// === 八卦 ===

export interface TrigramDef {
  name: TrigramName;
  chinese: string;
  symbol: string;
  element: WuXing;
  binary: number;
}

// === 六十四卦 ===

export interface HexagramData {
  id: number;
  name: string;
  shortName: string;
  upperTrigram: TrigramName;
  lowerTrigram: TrigramName;
  binaryPattern: number;
  palace: string;
  palaceElement: WuXing;
  shiYaoPosition: number;
  yingYaoPosition: number;
  upperYaoWuXing: WuXing[];
  lowerYaoWuXing: WuXing[];
  guaCi: TextPair;
  yaoCi: YaoCiEntry[];
  element: WuXing;
}

export interface TextPair {
  original: string;
  modern: string;
}

export interface YaoCiEntry {
  position: number;
  label: string;
  original: string;
  modern: string;
}

// === 排盘输入 ===

export interface PaipanInput {
  question: string;
  gender: "男" | "女";
  yaoValues: [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];
  province: string;
  city: string;
  dateTime?: string;
}

// === 四柱 ===

export interface GanzhiCalendar {
  lunarDate: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  yearGan: TianGan;
  yearZhi: DiZhi;
  monthGan: TianGan;
  monthZhi: DiZhi;
  dayGan: TianGan;
  dayZhi: DiZhi;
  hourGan: TianGan;
  hourZhi: DiZhi;
  solarTerm: string;
  gregorianDate: string;
  trueSolarDate: string;
}

// === 排盘结果 ===

export interface PaipanResult {
  title: string;
  gender: "男" | "女";
  ganzhi: GanzhiCalendar;
  shenSha: ShenShaItem[];
  kongWang: string;
  baseHexagram: HexagramData;
  changedHexagram: HexagramData | null;
  movingYaoPositions: number[];
  yaoDetails: YaoDetail[];
}

export interface ShenShaItem {
  name: string;
  value: string;
  description: string;
}

// === AI 解卦 ===

export interface InterpretRequest {
  question: string;
  gender: "男" | "女";
  paipan: PaipanResult;
}

export interface PerspectiveResult {
  name: string;
  content: string;
  temperature: number;
}

export interface InterpretResult {
  perspectives: PerspectiveResult[];
  synthesis: string;
  timestamp: number;
}

// === 存档 ===

export interface ArchiveRecord {
  id: string;
  username: string;
  createdAt: string;
  input: PaipanInput;
  paipan: PaipanResult;
  interpretation?: InterpretResult;
}

export interface ArchiveStore {
  [username: string]: {
    passwordHash: string;
    records: ArchiveRecord[];
  };
}

import { Lunar, Solar, JieQi } from "lunar-typescript";
import type { TianGan, DiZhi, GanzhiCalendar } from "./types";

/**
 * 均时差（Equation of Time）简化公式
 * 返回分钟数，正值表示真太阳时快于平太阳时
 */
function equationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 根据经度计算真太阳时日期 */
function getTrueSolar(gregorianDate: Date, longitude: number): Date {
  const utc = gregorianDate.getTime() + gregorianDate.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utc + 8 * 3600000);
  const startOfYear = new Date(beijingTime.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((beijingTime.getTime() - startOfYear.getTime()) / 86400000);
  const lngDiff = (longitude - 120) * 4;
  const eot = equationOfTime(dayOfYear);
  const totalOffset = lngDiff + eot;
  return new Date(beijingTime.getTime() + totalOffset * 60000);
}

function ganToChar(g: string): string {
  const map: Record<string, string> = {
    JIA: "甲", YI: "乙", BING: "丙", DING: "丁", WU: "戊",
    JI: "己", GENG: "庚", XIN: "辛", REN: "壬", GUI: "癸",
  };
  return map[g] ?? g;
}

function zhiToChar(z: string): string {
  const map: Record<string, string> = {
    ZI: "子", CHOU: "丑", YIN: "寅", MAO: "卯", CHEN: "辰", SI: "巳",
    WU: "午", WEI: "未", SHEN: "申", YOU: "酉", XU: "戌", HAI: "亥",
  };
  return map[z] ?? z;
}

export function getGanzhiCalendar(date: string | Date, longitude: number): GanzhiCalendar {
  const d = typeof date === "string" ? new Date(date) : date;
  const solar = Solar.fromDate(d);
  const trueSolarDate = getTrueSolar(d, longitude);

  const trueSolar = Solar.fromDate(trueSolarDate);
  const lunar = trueSolar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearGan = ganToChar(eightChar.getYearGan()) as TianGan;
  const yearZhi = zhiToChar(eightChar.getYearZhi()) as DiZhi;
  const monthGan = ganToChar(eightChar.getMonthGan()) as TianGan;
  const monthZhi = zhiToChar(eightChar.getMonthZhi()) as DiZhi;
  const dayGan = ganToChar(eightChar.getDayGan()) as TianGan;
  const dayZhi = zhiToChar(eightChar.getDayZhi()) as DiZhi;
  const hourGan = ganToChar(eightChar.getTimeGan()) as TianGan;
  const hourZhi = zhiToChar(eightChar.getTimeZhi()) as DiZhi;

  const jieQi = lunar.getPrevJieQi() as JieQi | null;
  const curJieQi = lunar.getCurrentJieQi() as JieQi | null;
  const nextJieQi = lunar.getNextJieQi() as JieQi | null;
  let solarTerm = "";
  if (curJieQi && curJieQi.getSolar().toYmd() === solar.toYmd()) {
    solarTerm = curJieQi.getName();
  } else if (nextJieQi) {
    solarTerm = nextJieQi.getName();
  } else if (jieQi) {
    solarTerm = jieQi.getName();
  }

  return {
    lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearPillar: `${yearGan}${yearZhi}`,
    monthPillar: `${monthGan}${monthZhi}`,
    dayPillar: `${dayGan}${dayZhi}`,
    hourPillar: `${hourGan}${hourZhi}`,
    yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi,
    solarTerm,
    gregorianDate: solar.toYmd(),
    trueSolarDate: trueSolar.toYmd() + " " +
      String(trueSolar.getHour()).padStart(2, "0") + ":" +
      String(trueSolar.getMinute()).padStart(2, "0") + ":" +
      String(trueSolar.getSecond()).padStart(2, "0"),
  };
}

export function getCurrentSolarTerm(): string {
  const lunar = Lunar.fromDate(new Date());
  const jieQi = lunar.getCurrentJieQi() as JieQi | null;
  return jieQi?.getName() ?? "";
}

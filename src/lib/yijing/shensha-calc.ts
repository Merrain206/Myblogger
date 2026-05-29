import type { TianGan, DiZhi, ShenShaItem } from "./types";
import {
  TIANYI_GUIREN, YIMA_MAP, TAOHUA_MAP, WENCHANG, LUSHEN,
  HUAGAI_MAP, WANGSHEN_MAP,
} from "./data/shensha";

/** 日支查驿马 */
function getYima(dayZhi: DiZhi): DiZhi | undefined {
  return YIMA_MAP[dayZhi];
}

/** 日支查桃花 */
function getTaohua(dayZhi: DiZhi): DiZhi | undefined {
  return TAOHUA_MAP[dayZhi];
}

/** 日支查华盖 */
function getHuagai(dayZhi: DiZhi): DiZhi | undefined {
  return HUAGAI_MAP[dayZhi];
}

/** 日支查亡神 */
function getWangshen(dayZhi: DiZhi): DiZhi | undefined {
  return WANGSHEN_MAP[dayZhi];
}

/** 检查某柱是否包含指定地支 */
function pillarContainsZhi(pillar: string, zhi: DiZhi): boolean {
  return pillar.length >= 2 && pillar[1] === zhi;
}

export function calculateShenSha(
  dayGan: TianGan,
  dayZhi: DiZhi,
  yearZhi: DiZhi,
  monthZhi: DiZhi,
  yearPillar: string,
  monthPillar: string,
  dayPillar: string,
  hourPillar: string,
): ShenShaItem[] {
  const result: ShenShaItem[] = [];

  // 天乙贵人
  const tianyiZhi = TIANYI_GUIREN[dayGan] ?? [];
  const tianyiHits = [yearPillar, monthPillar, dayPillar, hourPillar]
    .filter((p) => tianyiZhi.some((z) => pillarContainsZhi(p, z)));
  if (tianyiHits.length > 0) {
    result.push({ name: "天乙贵人", value: tianyiZhi.join("、"), description: tianyiHits.map(tagPillar).join(" ") });
  }

  // 文昌
  const wenChangZhi = WENCHANG[dayGan];
  if (wenChangZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, wenChangZhi));
    if (hit.length > 0) {
      result.push({ name: "文昌", value: wenChangZhi, description: `${hit.map(tagPillar).join(" ")} 学业文书` });
    }
  }

  // 禄神
  const luShenZhi = LUSHEN[dayGan];
  if (luShenZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, luShenZhi));
    if (hit.length > 0) {
      result.push({ name: "禄神", value: luShenZhi, description: `${hit.map(tagPillar).join(" ")} 福禄` });
    }
  }

  // 驿马
  const yimaZhi = getYima(dayZhi);
  if (yimaZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, yimaZhi));
    if (hit.length > 0) {
      result.push({ name: "驿马", value: yimaZhi, description: `${hit.map(tagPillar).join(" ")} 奔波变动` });
    }
  }

  // 桃花
  const taohuaZhi = getTaohua(dayZhi);
  if (taohuaZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, taohuaZhi));
    if (hit.length > 0) {
      result.push({ name: "桃花", value: taohuaZhi, description: `${hit.map(tagPillar).join(" ")} 人缘魅力` });
    }
  }

  // 华盖
  const huagaiZhi = getHuagai(dayZhi);
  if (huagaiZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, huagaiZhi));
    if (hit.length > 0) {
      result.push({ name: "华盖", value: huagaiZhi, description: `${hit.map(tagPillar).join(" ")} 孤高才艺` });
    }
  }

  // 亡神
  const wangshenZhi = getWangshen(dayZhi);
  if (wangshenZhi) {
    const hit = [yearPillar, monthPillar, dayPillar, hourPillar]
      .filter((p) => pillarContainsZhi(p, wangshenZhi));
    if (hit.length > 0) {
      result.push({ name: "亡神", value: wangshenZhi, description: `${hit.map(tagPillar).join(" ")} 疑虑耗损` });
    }
  }

  return result;
}

function tagPillar(pillar: string): string {
  const labels = ["年柱", "月柱", "日柱", "时柱"];
  const all = [pillar];
  // 简化：只显示该柱
  return `${pillar}`;
}

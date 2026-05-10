/**
 * 解析 CET4.txt / CET6.txt → vocabulary.json（含构词法标注）
 *
 * 用法: npx tsx scripts/parse-vocabulary.ts
 */

import * as fs from "fs";
import * as path from "path";

interface WordEntry {
  word: string;
  phonetic: string;
  meaning: string;
  level: "CET4" | "CET6";
  root?: string;
  rootMeaning?: string;
  prefix?: string;
  prefixMeaning?: string;
  suffix?: string;
  suffixMeaning?: string;
}

// ═══ 词根数据库 ═══
const ROOTS: Record<string, string> = {
  "ag": "做，行动", "act": "做，行动",
  "cap": "拿，取", "cept": "拿，取", "ceive": "拿，取", "cip": "拿",
  "ced": "走，行", "ceed": "走，行", "cess": "走，行",
  "claim": "喊，叫", "clam": "喊，叫",
  "clud": "关闭", "clus": "关闭", "clos": "关闭",
  "cogn": "知道", "corp": "身体", "cred": "相信，信任",
  "cur": "跑", "curs": "跑", "cour": "跑",
  "dict": "说", "dic": "说",
  "duc": "引导", "duct": "引导",
  "fac": "做，制造", "fact": "做，制造", "fect": "做，制造",
  "fer": "带，携带", "fid": "信任", "fin": "结束，界限",
  "flect": "弯曲", "flex": "弯曲", "flu": "流",
  "form": "形状，形式", "fract": "打破", "frag": "打破",
  "gen": "产生，出生", "grad": "步，走", "gress": "步，走",
  "graph": "写，画", "gram": "写，画",
  "ject": "投，掷", "jud": "判断", "jur": "法律", "jus": "法律，公正",
  "lect": "选，收集", "leg": "法律；读", "log": "说；科学",
  "man": "手", "manu": "手", "mand": "命令",
  "mem": "记忆", "ment": "心，思",
  "miss": "发送", "mit": "发送",
  "mob": "移动", "mot": "移动", "mov": "移动",
  "nat": "出生", "nov": "新",
  "nounce": "说，报告", "nunci": "说，报告",
  "oper": "工作", "pass": "通过", "path": "感觉；病",
  "pel": "推动", "puls": "推动",
  "pend": "悬挂；支付", "pens": "悬挂；支付",
  "pet": "追求", "phon": "声音",
  "plen": "满", "plet": "满", "plic": "折叠",
  "pon": "放置", "pos": "放置", "port": "携带，搬运",
  "press": "压", "prim": "第一", "pris": "抓住",
  "psych": "心理，精神", "put": "思考",
  "quir": "寻求", "quis": "寻求", "quest": "寻求",
  "rect": "直", "reg": "规则，统治", "rupt": "破",
  "scrib": "写", "script": "写",
  "sec": "跟随", "sect": "切",
  "sens": "感觉", "sent": "感觉", "sequ": "跟随",
  "serv": "服务；保持", "sess": "坐", "sid": "坐",
  "sign": "标记", "sist": "站立", "soci": "同伴",
  "sol": "单独；太阳",
  "spec": "看", "spect": "看", "spic": "看",
  "spir": "呼吸", "stat": "站立", "stitut": "建立",
  "struct": "建造", "sum": "拿，取", "sume": "拿，取",
  "tact": "接触", "tag": "接触",
  "tain": "持，握", "ten": "持，握", "tin": "持，握",
  "tend": "伸展", "tens": "伸展", "tent": "伸展",
  "tort": "扭", "tract": "拉，拖", "tribut": "给予",
  "urb": "城市", "vac": "空", "van": "空",
  "ven": "来", "vent": "来", "ver": "真实",
  "vert": "转", "vers": "转",
  "vid": "看", "vis": "看", "view": "看",
  "vit": "生命", "viv": "生命",
  "voc": "叫", "vok": "叫", "volv": "转动", "volu": "转动",
};

// ═══ 前缀数据库 ═══
const PREFIXES: Record<string, string> = {
  "a-": "不，无", "ab-": "离开", "abs-": "离开",
  "ac-": "向，朝", "ad-": "向，朝，靠近",
  "af-": "向", "ag-": "向", "al-": "向；全",
  "an-": "不，无", "ante-": "前", "anti-": "反，对抗",
  "ap-": "向", "ar-": "向", "as-": "向", "at-": "向",
  "auto-": "自己，自动", "be-": "使…", "bene-": "好",
  "bi-": "二，双", "bio-": "生命", "by-": "旁边",
  "circum-": "周围", "co-": "共同",
  "col-": "共同", "com-": "共同", "con-": "共同",
  "contra-": "反对", "cor-": "共同", "counter-": "反对",
  "de-": "去除；向下", "deca-": "十", "di-": "二；分离",
  "dia-": "穿过", "dif-": "不；分离",
  "dis-": "不；分离；相反",
  "e-": "出，外", "ef-": "出",
  "em-": "使…进入", "en-": "使…；在…里",
  "equi-": "相等", "ex-": "出；前", "extra-": "超出",
  "fore-": "前，先", "geo-": "地球", "hemi-": "半",
  "hyper-": "过度", "il-": "不", "im-": "不；使…",
  "in-": "不；在…里", "inter-": "在…之间",
  "intra-": "内部", "intro-": "向内", "ir-": "不",
  "kilo-": "千", "macro-": "大", "mal-": "坏",
  "micro-": "微", "mid-": "中", "milli-": "千分之一",
  "mini-": "小", "mis-": "错误", "mono-": "单一",
  "multi-": "多", "ne-": "不", "neg-": "不",
  "non-": "不，非", "ob-": "反，逆",
  "out-": "超出", "over-": "超过；过度",
  "per-": "完全，彻底", "peri-": "周围",
  "poly-": "多", "post-": "后", "pre-": "前，预先",
  "pro-": "向前；支持", "pseudo-": "假",
  "psycho-": "心理", "re-": "再次；回；相反",
  "retro-": "向后", "se-": "分开", "semi-": "半",
  "sub-": "下，次", "suc-": "下", "suf-": "下",
  "sup-": "下", "super-": "超，上", "sur-": "超，上",
  "sym-": "共同", "syn-": "共同",
  "tele-": "远", "trans-": "穿过，转移",
  "tri-": "三", "ultra-": "极端",
  "un-": "不；相反", "under-": "不足",
  "uni-": "一", "up-": "向上", "with-": "反对；向后",
};

// ═══ 后缀数据库 ═══
const SUFFIXES: Record<string, string> = {
  "-ability": "可…性", "-able": "可…的", "-acy": "性质",
  "-age": "状态；集合", "-al": "…的", "-ance": "性质",
  "-ancy": "性质", "-ant": "…的人/物",
  "-ar": "…的", "-ary": "…的", "-ate": "使…",
  "-ation": "行为，结果", "-ative": "有…倾向的",
  "-cy": "性质", "-dom": "领域", "-ed": "已…的",
  "-ee": "被…的人", "-eer": "从事…的人",
  "-en": "使…", "-ence": "性质", "-ency": "性质",
  "-ent": "…的", "-er": "…的人/物", "-ern": "…方向的",
  "-ese": "…人/语的", "-ess": "女性", "-est": "最…",
  "-fold": "倍", "-free": "无…的", "-ful": "充满…的",
  "-fy": "使…化", "-hood": "身份", "-ial": "…的",
  "-ian": "…的人", "-ible": "可…的", "-ic": "…的",
  "-ical": "…的", "-ify": "使…化", "-ion": "行为，状态",
  "-ious": "有…性质的", "-ish": "稍…的",
  "-ism": "主义", "-ist": "…者", "-ity": "性质",
  "-ive": "有…倾向的", "-ize": "使…化", "-ise": "使…化",
  "-less": "无…的", "-like": "像…的", "-logy": "…学",
  "-ly": "…地", "-ment": "行为，结果", "-ness": "性质",
  "-or": "…的人/物", "-ory": "…的", "-ous": "有…的",
  "-proof": "防…的", "-ship": "状态，关系",
  "-sion": "行为", "-some": "有…倾向的",
  "-tion": "行为，状态", "-tious": "有…性质的",
  "-tude": "性质", "-ty": "性质", "-ure": "行为，结果",
  "-ward": "向…", "-wards": "向…", "-wise": "以…方式",
  "-y": "有…的",
};

// ═══ 解析函数 ═══
function parseCET4(text: string): WordEntry[] {
  const entries: WordEntry[] = [];
  const seen = new Set<string>();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || /^[A-Z]$/.test(t)) continue;
    if (/^(大学|共|\d)/.test(t)) continue;
    const m = t.match(/^(\S+)\s+\[([^\]]+)\]\s+(.+)$/);
    if (!m) continue;
    const word = m[1].toLowerCase().replace(/[^a-z-]/g, "");
    if (!word || seen.has(word)) continue;
    seen.add(word);
    entries.push({ word, phonetic: `/${m[2]}/`, meaning: m[3].trim(), level: "CET4" });
  }
  return entries;
}

function parseCET6(text: string): WordEntry[] {
  const entries: WordEntry[] = [];
  const seen = new Set<string>();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || /^[A-Z]$/.test(t)) continue;
    const m = t.match(/^(\S+)\s+\[([^\]]+)\]\s+(.+)$/);
    if (!m) continue;
    const word = m[1].toLowerCase().replace(/[^a-z-]/g, "");
    if (!word || seen.has(word)) continue;
    seen.add(word);
    entries.push({ word, phonetic: `/${m[2]}/`, meaning: m[3].trim(), level: "CET6" });
  }
  return entries;
}

// ═══ 构词法分析 ═══
function analyzeMorphology(entry: WordEntry): WordEntry {
  const w = entry.word;

  // 按长度降序避免短前缀误匹配
  const pfxSorted = Object.entries(PREFIXES).sort((a, b) => b[0].length - a[0].length);
  const sfxSorted = Object.entries(SUFFIXES).sort((a, b) => b[0].length - a[0].length);

  for (const [pfx, pfxMeaning] of pfxSorted) {
    const stem = pfx.replace(/-$/, "");
    if (w.startsWith(stem) && w.length > stem.length + 1) {
      const rest = w.slice(stem.length);

      for (const [sfx, sfxMeaning] of sfxSorted) {
        const sfxStem = sfx.replace(/^-/, "");
        if (rest.endsWith(sfxStem) && rest.length > sfxStem.length) {
          const middle = rest.slice(0, rest.length - sfxStem.length);
          if (middle.length >= 2) {
            for (const [root, rootMeaning] of Object.entries(ROOTS)) {
              if (middle.includes(root) && root.length >= 2) {
                return { ...entry, root, rootMeaning, prefix: stem + (pfx.endsWith("-") ? "-" : ""), prefixMeaning: pfxMeaning, suffix: (sfx.startsWith("-") ? "" : "-") + sfxStem, suffixMeaning: sfxMeaning };
              }
            }
            return { ...entry, prefix: stem + (pfx.endsWith("-") ? "-" : ""), prefixMeaning: pfxMeaning, suffix: (sfx.startsWith("-") ? "" : "-") + sfxStem, suffixMeaning: sfxMeaning };
          }
        }
      }

      // 仅前缀 + 词根
      for (const [root, rootMeaning] of Object.entries(ROOTS)) {
        if (rest.includes(root) && root.length >= 2) {
          return { ...entry, root, rootMeaning, prefix: stem + (pfx.endsWith("-") ? "-" : ""), prefixMeaning: pfxMeaning };
        }
      }
      return { ...entry, prefix: stem + (pfx.endsWith("-") ? "-" : ""), prefixMeaning: pfxMeaning };
    }
  }

  // 仅词根 + 后缀
  for (const [root, rootMeaning] of Object.entries(ROOTS)) {
    if (w.includes(root) && root.length >= 3 && w.length > root.length) {
      const after = w.slice(w.indexOf(root) + root.length);
      for (const [sfx, sfxMeaning] of sfxSorted) {
        const sfxStem = sfx.replace(/^-/, "");
        if (after.endsWith(sfxStem) && sfxStem.length >= 2) {
          return { ...entry, root, rootMeaning, suffix: (sfx.startsWith("-") ? "" : "-") + sfxStem, suffixMeaning: sfxMeaning };
        }
      }
      return { ...entry, root, rootMeaning };
    }
  }

  // 仅后缀
  for (const [sfx, sfxMeaning] of sfxSorted) {
    const sfxStem = sfx.replace(/^-/, "");
    if (w.endsWith(sfxStem) && sfxStem.length >= 2 && w.length > sfxStem.length + 1) {
      return { ...entry, suffix: (sfx.startsWith("-") ? "" : "-") + sfxStem, suffixMeaning: sfxMeaning };
    }
  }

  return entry;
}

// ═══ 主入口 ═══
function main() {
  const dataDir = path.join(process.cwd(), "src", "data");
  const cet4Raw = fs.readFileSync(path.join(dataDir, "CET4.txt"), "utf-8");
  const cet6Raw = fs.readFileSync(path.join(dataDir, "CET6.txt"), "utf-8");

  console.log("解析 CET4...");
  const cet4 = parseCET4(cet4Raw);
  console.log(`  → ${cet4.length} 词`);

  console.log("解析 CET6...");
  const cet6 = parseCET6(cet6Raw);
  console.log(`  → ${cet6.length} 词`);

  // 合并：CET4 词条被 CET6 同名覆盖（升级为六级），新词加入
  const all = new Map<string, WordEntry>();
  for (const w of cet4) all.set(w.word, w);
  for (const w of cet6) {
    if (all.has(w.word)) {
      const old = all.get(w.word)!;
      all.set(w.word, { ...old, level: "CET6", meaning: w.meaning || old.meaning });
    } else {
      all.set(w.word, w);
    }
  }
  console.log(`合并后: ${all.size} 词`);

  // 构词分析
  let analyzedCount = 0;
  const analyzed: WordEntry[] = [];
  for (const entry of all.values()) {
    const r = analyzeMorphology(entry);
    if (r.root || r.prefix || r.suffix) analyzedCount++;
    analyzed.push(r);
  }
  console.log(`构词标注: ${analyzedCount} 词`);

  // 分组
  const rootMap = new Map<string, WordEntry[]>();
  const ungrouped: WordEntry[] = [];
  for (const e of analyzed) {
    if (e.root) {
      if (!rootMap.has(e.root)) rootMap.set(e.root, []);
      rootMap.get(e.root)!.push(e);
    } else {
      ungrouped.push(e);
    }
  }

  interface RootGroup { root: string; rootMeaning: string; words: WordEntry[] }
  const output: RootGroup[] = [];

  const sortedRoots = [...rootMap.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [root, words] of sortedRoots) {
    output.push({ root, rootMeaning: ROOTS[root] || "", words: words.sort((a, b) => a.word.localeCompare(b.word)) });
  }

  if (ungrouped.length > 0) {
    output.push({ root: "__ungrouped__", rootMeaning: "独立词汇（无明显构词法）", words: ungrouped.sort((a, b) => a.word.localeCompare(b.word)) });
  }

  const outPath = path.join(dataDir, "vocabulary.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n输出: ${outPath}`);
  console.log(`词根组: ${sortedRoots.length}, 独立词: ${ungrouped.length}, 总计: ${analyzed.length}`);
  console.log(`大小: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
}

main();

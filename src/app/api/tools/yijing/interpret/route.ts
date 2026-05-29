import { NextResponse } from "next/server";
import type { InterpretRequest, PerspectiveResult } from "@/lib/yijing/types";

const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const PERSPECTIVES: { name: string; role: string; temperature: number }[] = [
  {
    name: "卦象解读",
    role: "你是一位资深周易卦师，精通六十四卦的卦象、卦辞和大义。请结合用户的问题和卦象结构，解读本卦和变卦的含义。要求：语言典雅但不晦涩，直接给出解读不要开场白。",
    temperature: 0.3,
  },
  {
    name: "动爻解读",
    role: "你是一位爻辞专家，精研三百八十四爻的爻辞和变卦趋势。请逐一分析各动爻的含义和启示。如果没有动爻，请分析静卦的含义。要求：条理清晰，直接给出解读不要开场白。",
    temperature: 0.5,
  },
  {
    name: "综合建议",
    role: "你是一位人生导师，善于结合卦象智慧给出切实可行的行动建议。请结合卦象的吉凶和用户的具体问题，给出务实的指导。要求：温暖有力量，具体可执行，直接给出建议不要开场白。",
    temperature: 0.7,
  },
];

async function callDeepSeek(systemPrompt: string, userMessage: string, temperature: number): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API 返回 ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function buildUserMessage(input: InterpretRequest): string {
  const { question, gender, paipan } = input;
  const { ganzhi, baseHexagram, changedHexagram, yaoDetails, shenSha, kongWang } = paipan;

  const labels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  const lines = [
    `用户问题：${question}`,
    `性别：${gender === "男" ? "男" : "女"}`,
    `排盘时间：${ganzhi.gregorianDate}，真太阳时：${ganzhi.trueSolarDate}`,
    `农历：${ganzhi.lunarDate}`,
    `节气：${ganzhi.solarTerm || "无"}`,
    `四柱：年${ganzhi.yearPillar} 月${ganzhi.monthPillar} 日${ganzhi.dayPillar} 时${ganzhi.hourPillar}`,
    `空亡：${kongWang || "无"}`,
    `本卦：${baseHexagram.name}（${baseHexagram.palace}，属${baseHexagram.palaceElement}）`,
    `卦辞：${baseHexagram.guaCi.original}`,
  ];

  if (changedHexagram) {
    lines.push(`变卦：${changedHexagram.name}（${changedHexagram.palace}，属${changedHexagram.palaceElement}）`);
    lines.push(`卦辞：${changedHexagram.guaCi.original}`);
  }

  lines.push("六爻详情：");
  for (const yao of [...yaoDetails].reverse()) {
    const suffix = yao.isMoving ? " (动爻)" : "";
    lines.push(`  ${labels[yao.position - 1]}：${yao.liuQin} ${yao.wuXing}${suffix}`);
  }

  if (paipan.movingYaoPositions.length > 0) {
    lines.push(`动爻位置：${paipan.movingYaoPositions.map((p) => labels[p - 1]).join("、")}`);
    lines.push("动爻辞：");
    for (const pos of paipan.movingYaoPositions) {
      const ci = baseHexagram.yaoCi[pos - 1];
      lines.push(`  ${ci.label}：${ci.original}（${ci.modern}）`);
    }
  }

  if (shenSha.length > 0) {
    lines.push(`神煞：${shenSha.map((s) => `${s.name}(${s.value})`).join("、")}`);
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const input: InterpretRequest = await request.json();

    if (!input.question || !input.paipan) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const userMessage = buildUserMessage(input);

    // 并行 3 个视角
    const perspectiveResults = await Promise.allSettled(
      PERSPECTIVES.map(async (p) => {
        const content = await callDeepSeek(p.role, userMessage, p.temperature);
        return { name: p.name, content, temperature: p.temperature } as PerspectiveResult;
      }),
    );

    const perspectives: PerspectiveResult[] = [];
    for (const r of perspectiveResults) {
      if (r.status === "fulfilled") {
        perspectives.push(r.value);
      }
    }

    if (perspectives.length === 0) {
      return NextResponse.json({ error: "所有 AI 视角均调用失败" }, { status: 500 });
    }

    // 综合分析
    let synthesis = "";
    try {
      const synthesisPrompt =
        "你是一位周易大师，请综合以下多个视角的分析，给出一个统一、全面的解卦结论。" +
        "要求：综合各视角的核心观点，给出完整的解读，包含吉凶判断、趋势分析和具体建议。直接输出结论不要开场白。";

      const perspectivesText = perspectives
        .map((p) => `【${p.name}】\n${p.content}`)
        .join("\n\n");

      synthesis = await callDeepSeek(synthesisPrompt, perspectivesText, 0.5);
    } catch {
      synthesis = perspectives.map((p) => `【${p.name}】\n${p.content}`).join("\n\n");
    }

    return NextResponse.json({
      perspectives,
      synthesis,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "未知错误" },
      { status: 500 },
    );
  }
}

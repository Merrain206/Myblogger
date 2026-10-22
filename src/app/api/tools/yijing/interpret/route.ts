import { z } from "zod";
import { requireAdminMutation } from "@/lib/auth/route-auth";
import { callAiService, checkAiRequestBudget } from "@/lib/security/ai-guard";
import { parseJsonBody, privateJson } from "@/lib/security/http";
import { interpretRequestSchema } from "@/lib/yijing/schemas";
import type { PerspectiveResult } from "@/lib/yijing/types";

export const dynamic = "force-dynamic";

const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const aiResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().max(30_000) }).passthrough(),
  }).passthrough()).min(1).max(8),
}).passthrough();

const PERSPECTIVES = [
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
] as const;

async function callDeepSeek(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  maxTokens = 1536,
): Promise<string> {
  const raw = await callAiService(API_URL, apiKey, {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature,
    max_tokens: maxTokens,
  });
  const parsed = aiResponseSchema.safeParse(raw);
  if (!parsed.success) throw new Error("AI response invalid");
  return parsed.data.choices[0].message.content;
}

function buildUserMessage(input: z.infer<typeof interpretRequestSchema>): string {
  const { question, gender, paipan } = input;
  const { ganzhi, baseHexagram, changedHexagram, yaoDetails, shenSha, kongWang } = paipan;
  const labels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  const lines = [
    `用户问题：${question}`,
    `性别：${gender}`,
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
    lines.push(`  ${labels[yao.position - 1]}：${yao.liuQin} ${yao.wuXing}${yao.isMoving ? " (动爻)" : ""}`);
  }
  if (paipan.movingYaoPositions.length > 0) {
    lines.push(`动爻位置：${paipan.movingYaoPositions.map((position) => labels[position - 1]).join("、")}`);
    lines.push("动爻辞：");
    for (const position of paipan.movingYaoPositions) {
      const text = baseHexagram.yaoCi[position - 1];
      lines.push(`  ${text.label}：${text.original}（${text.modern}）`);
    }
  }
  if (shenSha.length > 0) {
    lines.push(`问卦时刻神煞：${shenSha.map((item) => `${item.name}(${item.value})`).join("、")}`);
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  const body = await parseJsonBody(request, interpretRequestSchema, { maxBytes: 96 * 1024, maxDepth: 12 });
  if (!body.ok) return body.response;

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return privateJson({ error: "AI 服务未配置" }, { status: 503 });
  const quotaResponse = checkAiRequestBudget(request, 12_000);
  if (quotaResponse) return quotaResponse;

  try {
    const userMessage = buildUserMessage(body.data);
    const results = await Promise.allSettled(
      PERSPECTIVES.map(async (perspective) => ({
        name: perspective.name,
        content: await callDeepSeek(apiKey, perspective.role, userMessage, perspective.temperature),
        temperature: perspective.temperature,
      } satisfies PerspectiveResult)),
    );
    const perspectives = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    if (perspectives.length === 0) {
      return privateJson({ error: "AI 服务暂时不可用" }, { status: 502 });
    }

    let synthesis = perspectives.map((item) => `【${item.name}】\n${item.content}`).join("\n\n");
    try {
      synthesis = await callDeepSeek(
        apiKey,
        "你是一位周易大师，请综合多个视角给出统一、完整的解卦结论，包含吉凶判断、趋势分析和具体建议。直接输出结论。",
        synthesis,
        0.5,
        3072,
      );
    } catch {
      // 保留已成功的视角，不向客户端泄露上游错误。
    }

    return privateJson({ perspectives, synthesis, timestamp: Date.now() });
  } catch {
    return privateJson({ error: "AI 服务暂时不可用" }, { status: 502 });
  }
}

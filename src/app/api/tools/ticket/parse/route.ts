import { z } from "zod";
import { requireAdminMutation } from "@/lib/auth/route-auth";
import { callAiService, checkAiRequestBudget } from "@/lib/security/ai-guard";
import { parseJsonBody, privateJson } from "@/lib/security/http";
import { ticketDataSchema, ticketParseRequestSchema } from "@/lib/ticket/schema";

export const dynamic = "force-dynamic";

const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const upstreamSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().max(20_000).optional(),
      reasoning_content: z.string().max(20_000).optional(),
    }).passthrough(),
  }).passthrough()).min(1).max(8),
}).passthrough();

const SYSTEM_PROMPT = `你是火车票信息抽取工具。从 12306 电子发票 OCR 文本中提取结构化信息，只返回 JSON，不要其他文字。
必须返回且仅返回这些字符串字段：serial, gate, fromStation, fromPinyin, toStation, toPinyin, trainCode, dateTime, carriage, seatNumber, berthType, seatType, price, idNumber, passengerName, footerInfo, discountType, invoiceNo, electronicTicketNo, issueDate。
无内容的字段返回空字符串。身份证号只允许脱敏格式（前6位+****+后4位）。price 不含“元”并保留一位小数。`;

export async function POST(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  const body = await parseJsonBody(request, ticketParseRequestSchema, { maxBytes: 16 * 1024, maxDepth: 2 });
  if (!body.ok) return body.response;

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return privateJson({ error: "AI 服务未配置" }, { status: 503 });
  const quotaResponse = checkAiRequestBudget(request, 2_500);
  if (quotaResponse) return quotaResponse;

  try {
    const raw = await callAiService(API_URL, apiKey, {
      model: MODEL,
      max_tokens: 800,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body.data.text },
      ],
    });
    const upstream = upstreamSchema.safeParse(raw);
    if (!upstream.success) throw new Error("invalid upstream response");
    const content = upstream.data.choices[0].message.content
      || upstream.data.choices[0].message.reasoning_content
      || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("invalid upstream response");

    const candidate: unknown = JSON.parse(match[0]);
    const parsed = ticketDataSchema.safeParse(candidate);
    if (!parsed.success) throw new Error("invalid upstream response");
    if (parsed.data.seatType === "新空调 硬座") parsed.data.seatType = "新空调硬座";
    if (/^\d+(\.\d+)?$/.test(parsed.data.price)) {
      parsed.data.price = Number(parsed.data.price).toFixed(1);
    }
    return privateJson({ data: parsed.data });
  } catch {
    return privateJson({ error: "AI 返回格式异常，请稍后重试" }, { status: 502 });
  }
}

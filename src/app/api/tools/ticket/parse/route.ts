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

const SYSTEM_PROMPT = `你是一个火车票信息抽取工具。从 12306 电子发票 OCR 文本中提取结构化信息，只返回 JSON，不要任何其他文字。

必须返回且仅返回以下字符串字段：
{
  "serial": "票号（10位）",
  "gate": "检票口（如5A）",
  "fromStation": "出发站（中文，去掉‘站’字）",
  "fromPinyin": "出发站拼音",
  "toStation": "到达站（中文，去掉‘站’字）",
  "toPinyin": "到达站拼音",
  "trainCode": "车次（如G2025）",
  "dateTime": "乘车日期时间（YYYY-MM-DD HH:mm）",
  "carriage": "车厢号（2位数字）",
  "seatNumber": "座位号（如12F）",
  "berthType": "铺位（上/中/下，非卧铺留空）",
  "seatType": "席别（一等座/二等座/商务座/软卧/硬卧等）",
  "price": "票价（数字）",
  "idNumber": "身份证号（脱敏格式如3201021990****5678）",
  "passengerName": "乘客姓名",
  "footerInfo": "底部售票信息",
  "discountType": "优惠类型（student/child/military/disabled/elder/discount，无则留空）",
  "invoiceNo": "发票号码（20位数字）",
  "electronicTicketNo": "电子客票号（如20750A6086123197541562025）",
  "issueDate": "开票日期（YYYY-MM-DD）"
}

规则：
- 无内容的字段返回空字符串。
- 车次格式为字母加2至5位数字，例如G2025、D3357。
- 乘车日期优先取实际乘车日期，不是开票日期；时间格式为HH:mm。
- 开票日期是发票开具日期，与乘车日期不同。
- 发票号码在电子发票上标注为“发票号码”或“INVOICE NO”，通常为20位数字。
- 电子客票号在电子发票上标注为“电子客票号”或“E-TICKET NO”。
- 身份证号只允许脱敏格式，保留前6位、四个星号和后4位。
- 票价不含“元”，统一保留一位小数；例如93.00输出93.0，27.50输出27.5，24.33输出24.3。
- 票号取电子客票号第4至12位；例如20750A6086123197541562025对应50A608612。没有电子客票号则留空。
- 车厢和座位可能连写，例如“02车无座”或“07车12F号”。carriage分别取02或07，seatNumber分别取“无座”或“12F”，不带“车”或“号”。
- 座位号为“无座”时，seatNumber填“无座”，seatType填“二等座”。
- 席别可能是“新空调硬座”“硬卧代硬座”等复合词，必须完整保留，不要拆分或改写。`;

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

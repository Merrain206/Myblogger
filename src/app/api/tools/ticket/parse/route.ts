import { NextResponse } from "next/server";

const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const SYSTEM_PROMPT = `你是一个火车票信息抽取工具。从12306电子发票OCR文本中提取结构化信息，只返回JSON，不要任何其他文字。

JSON格式：
{
  "serial": "票号(10位)",
  "gate": "检票口(如5A)",
  "fromStation": "出发站(中文，去掉'站'字)",
  "fromPinyin": "出发站拼音",
  "toStation": "到达站(中文，去掉'站'字)",
  "toPinyin": "到达站拼音",
  "trainCode": "车次(如G2025)",
  "dateTime": "日期时间(YYYY-MM-DD HH:mm)",
  "carriage": "车厢号(2位数字)",
  "seatNumber": "座位号(如12F)",
  "berthType": "铺位(上/中/下，非卧铺留空)",
  "seatType": "席别(一等座/二等座/商务座/软卧/硬卧等)",
  "price": "票价(数字)",
  "idNumber": "身份证号(脱敏格式如3201021990****5678)",
  "passengerName": "乘客姓名",
  "footerInfo": "底部售票信息(发票号+售票站)",
  "discountType": "优惠类型(student/child/military/disabled/elder/discount，无则留空)"
}

规则：
- 车次格式：字母+2-5位数字（如G2025、D3357）
- 日期优先取乘车日期，不是开票日期。时间格式HH:mm
- 身份证号保留脱敏格式（前6位+****+后4位）
- 票价取数字部分，不含"元"字
- 没有的字段留空字符串""`;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "缺少文本" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[车票解析API] DeepSeek请求失败:", response.status, errText);
      return NextResponse.json(
        { error: `AI 服务请求失败: ${response.status}` },
        { status: 502 }
      );
    }

    const raw = await response.json();
    const content = raw?.choices?.[0]?.message?.content
      || raw?.choices?.[0]?.message?.reasoning_content
      || raw?.content?.[0]?.text
      || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[车票解析API] 无法从响应提取JSON:", content);
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ data: parsed });
    } catch {
      console.error("[车票解析API] JSON解析失败:", jsonMatch[0]);
      return NextResponse.json(
        { error: "AI 返回JSON解析失败，请重试" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[车票解析API] 异常:", err);
    return NextResponse.json(
      { error: "服务器异常" },
      { status: 500 }
    );
  }
}

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
  "dateTime": "乘车日期时间(YYYY-MM-DD HH:mm)",
  "carriage": "车厢号(2位数字)",
  "seatNumber": "座位号(如12F)",
  "berthType": "铺位(上/中/下，非卧铺留空)",
  "seatType": "席别(一等座/二等座/商务座/软卧/硬卧等)",
  "price": "票价(数字)",
  "idNumber": "身份证号(脱敏格式如3201021990****5678)",
  "passengerName": "乘客姓名",
  "footerInfo": "底部售票信息",
  "discountType": "优惠类型(student/child/military/disabled/elder/discount，无则留空)",
  "invoiceNo": "发票号码(20位数字)",
  "electronicTicketNo": "电子客票号(如20750A6086123197541562025)",
  "issueDate": "开票日期(YYYY-MM-DD)"
}

规则：
- 车次格式：字母+2-5位数字（如G2025、D3357）
- 乘车日期优先取乘车日期，不是开票日期。时间格式HH:mm
- 开票日期是发票开具日期，与乘车日期不同
- 发票号码在电子发票上标注为"发票号码"或"INVOICE NO"，通常20位数字
- 电子客票号在电子发票上标注为"电子客票号"或"E-TICKET NO"
- 身份证号保留脱敏格式（前6位+****+后4位）
- 票价：电子发票显示两位小数（如93.00元、27.50元、24.33元）。输出时统一保留一位小数：小数部分为0则输出如93.0；小数部分不为0则四舍五入到一位小数，如27.5、24.3。不含"元"字
- 票号取电子客票号第4-12位（如电子客票号20750A6086123197541562025则票号为50A608612），如无电子客票号则留空
- 车厢和座位可能连写如"02车无座"或"07车12F号"，此时carriage取数字部分（如"02"），seatNumber取后面的座位信息（如"无座"或"12F"），seatNumber不带"号"字
- 座位号为"无座"时，seatNumber填"无座"，seatType填"二等座"
- 席别可能是复合词如"新空调硬座"或"硬卧代硬座"，完整保留
- 席别可能是复合词如"硬卧代硬座"，完整保留
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
      if (parsed.seatType === "新空调 硬座") parsed.seatType = "新空调硬座";
      // 票价统一补成一位小数
      if (parsed.price && /^\d+(\.\d+)?$/.test(parsed.price)) {
        parsed.price = parseFloat(parsed.price).toFixed(1);
      }
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

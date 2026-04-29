import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DEEPSEEK_API_KEY!;
const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/anthropic";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { system, messages } = body as {
      system: string;
      messages: { role: "user" | "assistant"; content: string }[];
    };

    const response = await fetch(`${API_URL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return NextResponse.json(
        { error: `API 调用失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    // DeepSeek Anthropic-compatible response: content blocks with type "thinking" and "text"
    const contentBlocks = data.content || [];

    // 提取思考过程
    const thinkingBlock = contentBlocks.find((b: any) => b.type === "thinking");
    const rawThinking = thinkingBlock?.thinking || "";

    // 提取文字回复
    const textBlock = contentBlocks.find((b: any) => b.type === "text");
    const rawText = textBlock?.text || "";

    // Try to parse JSON from text response
    // First, try to find a JSON block (possibly in markdown code fences)
    let jsonStr = "";
    const fenceMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1];
    } else {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      jsonStr = jsonMatch ? jsonMatch[0] : "";
    }

    let parsed: any = null;
    if (jsonStr) {
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // JSON parse failed, use raw text
      }
    }

    return NextResponse.json({
      thinking: parsed?.thinking || rawThinking,
      speech: parsed?.speech || rawText || "嗯，让我想想...",
      action: parsed?.action || null,
    });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

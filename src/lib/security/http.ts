import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function privateJson(data: unknown, init: ResponseInit = {}): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { ...noStoreHeaders, ...init.headers },
  });
}

function configuredOrigins(): Set<string> {
  return new Set(
    (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = configuredOrigins();
  if (allowed.has(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    return origin === new URL(request.url).origin;
  }
  return false;
}

export function clientIp(request: Request): string {
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded && forwarded.length <= 64) return forwarded;
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp && realIp.length <= 64) return realIp;
  }
  return "direct";
}

function jsonDepth(value: unknown, depth = 0): number {
  if (value === null || typeof value !== "object") return depth;
  if (depth > 20) return depth;
  const values = Array.isArray(value) ? value : Object.values(value);
  let max = depth;
  for (const child of values) max = Math.max(max, jsonDepth(child, depth + 1));
  return max;
}

export type JsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options: { maxBytes?: number; maxDepth?: number } = {},
): Promise<JsonBodyResult<T>> {
  const maxBytes = options.maxBytes ?? 64 * 1024;
  const maxDepth = options.maxDepth ?? 10;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, response: privateJson({ error: "请求体过大" }, { status: 413 }) };
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxBytes) {
      return { ok: false, response: privateJson({ error: "请求体过大" }, { status: 413 }) };
    }
    const value: unknown = JSON.parse(raw);
    if (jsonDepth(value) > maxDepth) {
      return { ok: false, response: privateJson({ error: "JSON 嵌套过深" }, { status: 400 }) };
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return { ok: false, response: privateJson({ error: "请求参数无效" }, { status: 400 }) };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, response: privateJson({ error: "请求格式错误" }, { status: 400 }) };
  }
}

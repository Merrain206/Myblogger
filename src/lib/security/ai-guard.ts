import { reserveAiQuota } from "@/lib/database";
import { clientIp, privateJson } from "@/lib/security/http";
import { FixedWindowRateLimiter } from "@/lib/security/rate-limit";

const ipLimiter = new FixedWindowRateLimiter();
const accountLimiter = new FixedWindowRateLimiter();
let upstreamInFlight = 0;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export function checkAiRequestBudget(request: Request, estimatedTokens: number) {
  const ip = clientIp(request);
  if (!ipLimiter.check(`ai:ip:${ip}`, positiveInteger("AI_IP_REQUESTS_PER_MINUTE", 6), 60_000)
    || !accountLimiter.check("ai:account:admin", positiveInteger("AI_ACCOUNT_REQUESTS_PER_MINUTE", 12), 60_000)) {
    return privateJson({ error: "请求过于频繁" }, { status: 429 });
  }

  const costPerMillion = Number(process.env.AI_ESTIMATED_COST_PER_MILLION_USD || "2");
  const estimatedCostMicros = Math.max(1, Math.ceil(estimatedTokens * costPerMillion));
  try {
    const accepted = reserveAiQuota({
      estimatedTokens,
      requestLimit: positiveInteger("AI_DAILY_REQUEST_LIMIT", 100),
      tokenLimit: positiveInteger("AI_DAILY_TOKEN_LIMIT", 300_000),
      costLimitMicros: Math.ceil(Number(process.env.AI_DAILY_COST_USD_LIMIT || "5") * 1_000_000),
      estimatedCostMicros,
    });
    return accepted ? null : privateJson({ error: "今日 AI 配额已用尽" }, { status: 429 });
  } catch {
    return privateJson({ error: "AI 配额服务不可用" }, { status: 503 });
  }
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function callAiService(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const now = Date.now();
  if (circuitOpenUntil > now) throw new Error("AI service unavailable");
  const maxConcurrency = positiveInteger("AI_GLOBAL_CONCURRENCY", 4);
  if (upstreamInFlight >= maxConcurrency) throw new Error("AI service busy");

  upstreamInFlight += 1;
  try {
    const timeoutMs = positiveInteger("AI_UPSTREAM_TIMEOUT_MS", 20_000);
    const maxRetries = Math.min(1, positiveInteger("AI_UPSTREAM_MAX_RETRIES", 1));
    let lastError: Error = new Error("AI service failed");

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          lastError = new Error("AI service failed");
          if (attempt < maxRetries && retryableStatus(response.status)) continue;
          throw lastError;
        }
        const result: unknown = await response.json();
        consecutiveFailures = 0;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("AI service failed");
        if (attempt >= maxRetries) throw lastError;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw lastError;
  } catch (error) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= 5) {
      circuitOpenUntil = Date.now() + 60_000;
      consecutiveFailures = 0;
    }
    throw error;
  } finally {
    upstreamInFlight -= 1;
  }
}

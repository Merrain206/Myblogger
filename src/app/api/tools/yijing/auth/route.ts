import { z } from "zod";
import {
  clearSessionCookie,
  createAuthSession,
  requireAdmin,
  requireAdminMutation,
  revokeSession,
  setSessionCookie,
  validatePassword,
} from "@/lib/auth/route-auth";
import { clientIp, isAllowedOrigin, parseJsonBody, privateJson } from "@/lib/security/http";
import { FixedWindowRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const loginSchema = z.object({ password: z.string().min(1).max(256) }).strict();
const ipLimiter = new FixedWindowRateLimiter();
const accountLimiter = new FixedWindowRateLimiter();

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return privateJson({ error: "请求来源不受信任" }, { status: 403 });
  }

  const ip = clientIp(request);
  if (!ipLimiter.check(`login:ip:${ip}`, 5, 15 * 60 * 1000)
    || !accountLimiter.check("login:account:admin", 10, 15 * 60 * 1000)) {
    return privateJson({ error: "登录失败，请稍后重试" }, { status: 429 });
  }

  const body = await parseJsonBody(request, loginSchema, { maxBytes: 1024, maxDepth: 2 });
  if (!body.ok) return body.response;

  if (!await validatePassword(body.data.password)) {
    return privateJson({ error: "登录失败" }, { status: 401 });
  }

  const session = createAuthSession();
  if (!session) {
    return privateJson({ error: "认证服务未配置" }, { status: 503 });
  }

  const response = privateJson({ valid: true, csrfToken: session.csrfToken });
  setSessionCookie(response, session.token, session.maxAge);
  return response;
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  return privateJson({ valid: true, csrfToken: auth.session.csrf });
}

export async function DELETE(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  if (!revokeSession(auth.session.jti)) {
    return privateJson({ error: "认证服务不可用" }, { status: 503 });
  }
  const response = privateJson({ ok: true });
  clearSessionCookie(response);
  return response;
}

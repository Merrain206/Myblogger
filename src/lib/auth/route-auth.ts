import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";
import { isAllowedOrigin, noStoreHeaders } from "@/lib/security/http";
import { authSessionIsActive, registerAuthSession, revokeAuthSession } from "@/lib/database";

function scrypt(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export const AUTH_COOKIE_NAME = "merrain_admin_session";
const MIN_SECRET_BYTES = 32;
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;
const MIN_TTL_SECONDS = 5 * 60;
const MAX_TTL_SECONDS = 24 * 60 * 60;

interface SessionPayload {
  sub: "admin";
  role: "admin";
  iat: number;
  exp: number;
  csrf: string;
  jti: string;
}

interface AuthConfig {
  passwordHash: string;
  tokenSecret: Buffer;
  ttlSeconds: number;
}

export type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

function readConfig(): AuthConfig | null {
  const passwordHash = process.env.AUTH_PASSWORD_HASH?.trim().replaceAll("\\$", "$");
  const rawSecret = process.env.AUTH_TOKEN_SECRET?.trim();
  const ttlValue = Number(process.env.AUTH_TOKEN_TTL_SECONDS || DEFAULT_TTL_SECONDS);

  if (!passwordHash || !rawSecret || Buffer.byteLength(rawSecret, "utf8") < MIN_SECRET_BYTES) {
    return null;
  }
  if (!Number.isSafeInteger(ttlValue) || ttlValue < MIN_TTL_SECONDS || ttlValue > MAX_TTL_SECONDS) {
    return null;
  }

  return {
    passwordHash,
    tokenSecret: Buffer.from(rawSecret, "utf8"),
    ttlSeconds: ttlValue,
  };
}

function authUnavailable(): NextResponse {
  return NextResponse.json(
    { error: "认证服务未配置" },
    { status: 503, headers: noStoreHeaders },
  );
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "未授权" },
    { status: 401, headers: noStoreHeaders },
  );
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

function safeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return payload.sub === "admin"
    && payload.role === "admin"
    && Number.isSafeInteger(payload.iat)
    && Number.isSafeInteger(payload.exp)
    && typeof payload.csrf === "string"
    && payload.csrf.length >= 32
    && typeof payload.jti === "string"
    && payload.jti.length >= 16;
}

function signPayload(payload: SessionPayload, secret: Buffer): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function createAuthSession(): { token: string; csrfToken: string; maxAge: number } | null {
  const config = readConfig();
  if (!config) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "admin",
    role: "admin",
    iat: issuedAt,
    exp: issuedAt + config.ttlSeconds,
    csrf: randomBytes(24).toString("base64url"),
    jti: randomBytes(16).toString("base64url"),
  };

  try {
    registerAuthSession(payload.jti, payload.exp);
    return {
      token: signPayload(payload, config.tokenSecret),
      csrfToken: payload.csrf,
      maxAge: config.ttlSeconds,
    };
  } catch {
    return null;
  }
}

export function verifyToken(token: string): SessionPayload | null {
  const config = readConfig();
  if (!config) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = createHmac("sha256", config.tokenSecret).update(data).digest("base64url");
    if (!safeEqualText(signature, expected)) return null;

    const payload: unknown = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!isSessionPayload(payload)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now || payload.iat > now + 60 || payload.exp - payload.iat > config.ttlSeconds) {
      return null;
    }
    return authSessionIsActive(payload.jti, now) ? payload : null;
  } catch {
    return null;
  }
}

export async function validatePassword(password: string): Promise<boolean> {
  const config = readConfig();
  if (!config || typeof password !== "string") return false;

  try {
    const match = /^\$scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(
      config.passwordHash,
    );
    if (!match) return false;
    const [, nText, rText, pText, saltText, expectedText] = match;
    const N = Number(nText);
    const r = Number(rText);
    const p = Number(pText);
    if (N !== 16384 || r !== 8 || p !== 1) return false;

    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(expectedText, "base64url");
    if (salt.length < 16 || expected.length !== 32) return false;
    const actual = await scrypt(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function requireAdmin(request: Request): AuthResult {
  if (!readConfig()) return { ok: false, response: authUnavailable() };
  const token = parseCookie(request.headers.get("cookie"), AUTH_COOKIE_NAME);
  const session = token ? verifyToken(token) : null;
  return session ? { ok: true, session } : { ok: false, response: unauthorized() };
}

export function requireAdminMutation(request: Request): AuthResult {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth;

  if (!isAllowedOrigin(request)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "请求来源不受信任" },
        { status: 403, headers: noStoreHeaders },
      ),
    };
  }

  const csrfHeader = request.headers.get("x-csrf-token") || "";
  if (!safeEqualText(csrfHeader, auth.session.csrf)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "CSRF 校验失败" },
        { status: 403, headers: noStoreHeaders },
      ),
    };
  }

  return auth;
}

export function setSessionCookie(response: NextResponse, token: string, maxAge: number): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function revokeSession(jti: string): boolean {
  try {
    revokeAuthSession(jti);
    return true;
  } catch {
    return false;
  }
}

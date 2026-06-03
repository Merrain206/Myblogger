import { createHmac, timingSafeEqual } from "crypto";

const CORRECT_PASSWORD = "merrainbagua";
const SECRET = Buffer.from("yijing-bagua-secret-key-2026", "utf-8");
const TOKEN_TTL = 24 * 60 * 60 * 1000;

export function signToken(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, "utf-8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): boolean {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return false;
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  return password === CORRECT_PASSWORD;
}

export function createAuthToken(): string {
  return signToken({ exp: Date.now() + TOKEN_TTL });
}

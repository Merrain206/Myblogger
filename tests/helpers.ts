import { randomBytes, scrypt as scryptCallback } from "node:crypto";

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function configureTestAuth(password = "correct horse battery staple") {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt);
  process.env.AUTH_PASSWORD_HASH = `$scrypt$16384$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  process.env.AUTH_TOKEN_SECRET = randomBytes(32).toString("base64url");
  process.env.AUTH_TOKEN_TTL_SECONDS = "3600";
  process.env.ALLOWED_ORIGINS = "http://localhost:3000";
  return password;
}

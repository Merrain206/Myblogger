import { randomBytes, scrypt as scryptCallback } from "node:crypto";

function scrypt(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    let value = "";
    for await (const chunk of process.stdin) value += chunk;
    return value.trimEnd();
  }

  process.stdout.write("请输入新的管理员密码（输入不会回显）：");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return await new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    process.stdin.on("data", (key: string) => {
      if (key === "\u0003") { cleanup(); reject(new Error("cancelled")); return; }
      if (key === "\r" || key === "\n") { cleanup(); resolve(value); return; }
      if (key === "\u007f") { value = value.slice(0, -1); return; }
      value += key;
    });
  });
}

async function main(): Promise<void> {
  const password = await readPassword();
  if (password.length < 12) {
    throw new Error("密码至少需要 12 个字符。");
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 32);
  const passwordHash = `$scrypt$16384$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  console.log(`AUTH_PASSWORD_HASH=${passwordHash.replaceAll("$", "\\$")}`);
  console.log(`AUTH_TOKEN_SECRET=${randomBytes(32).toString("base64url")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "生成认证配置失败。");
  process.exit(1);
});

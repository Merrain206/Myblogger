import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/route-auth";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const execAsync = promisify(exec);

const ALLOWED_EXTENSIONS = new Set([
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp",
]);

const CONTAINER = "hermes-agent";
const CONTAINER_DIR = "/opt/data/memory";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ") || !verifyToken(auth.slice(7))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const destDir = path.join(process.cwd(), "public", "hermes");

  try {
    await execAsync(`sudo docker exec ${CONTAINER} ls ${CONTAINER_DIR}`);
  } catch {
    return NextResponse.json(
      { error: "容器不可用，此功能仅在生产服务器上可用", synced: [], count: 0, timestamp: Date.now() },
      { status: 404 }
    );
  }

  try {
    await fs.mkdir(destDir, { recursive: true });

    const { stdout } = await execAsync(
      `sudo docker exec ${CONTAINER} ls -p ${CONTAINER_DIR}`
    );

    const entries = stdout.split("\n").filter(Boolean);
    const synced: string[] = [];

    for (const name of entries) {
      if (name.endsWith("/")) continue;
      const ext = path.extname(name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      await execAsync(
        `sudo docker cp ${CONTAINER}:${CONTAINER_DIR}/${name} ${path.join(destDir, name)}`
      );
      synced.push(name);
    }

    return NextResponse.json({ synced, count: synced.length, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "同步失败" },
      { status: 500 }
    );
  }
}

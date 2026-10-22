import { promises as fs } from "node:fs";
import { extname } from "node:path";
import { requireAdmin } from "@/lib/auth/route-auth";
import { hermesMediaDirectory, resolveMediaPath } from "@/lib/hermes/sync";
import { noStoreHeaders, privateJson } from "@/lib/security/http";

export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  const directory = hermesMediaDirectory();
  const name = new URL(request.url).searchParams.get("name");

  if (name !== null) {
    const filePath = resolveMediaPath(directory, name);
    const mimeType = MIME_MAP[extname(name).toLowerCase()];
    if (!filePath || !mimeType) return privateJson({ error: "非法文件名" }, { status: 400 });
    try {
      const buffer = await fs.readFile(filePath);
      return new Response(buffer, {
        headers: {
          ...noStoreHeaders,
          "Content-Type": mimeType,
          "Content-Length": String(buffer.length),
          "Content-Security-Policy": "sandbox; default-src 'none'",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return privateJson({ error: "文件不存在" }, { status: 404 });
    }
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const images = [];
    for (const entry of entries) {
      const filePath = resolveMediaPath(directory, entry.name);
      const mimeType = MIME_MAP[extname(entry.name).toLowerCase()];
      if (!entry.isFile() || !filePath || !mimeType) continue;
      const stat = await fs.stat(filePath);
      images.push({
        name: entry.name,
        size: stat.size,
        mimeType,
        mtime: stat.mtimeMs,
        url: `/api/media?name=${encodeURIComponent(entry.name)}`,
      });
    }
    images.sort((left, right) => right.mtime - left.mtime);
    return privateJson({ images, count: images.length });
  } catch {
    return privateJson({ images: [], count: 0 });
  }
}

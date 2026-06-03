import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface ImageInfo {
  name: string;
  size: number;
  mimeType: string;
  mtime: number;
  url: string;
}

const MIME_MAP: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(request: NextRequest) {
  const dir = path.join(process.cwd(), "public", "hermes");

  // 如果有 ?name= 参数，直接返回文件内容
  const name = request.nextUrl.searchParams.get("name");
  if (name) {
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "非法文件名" }, { status: 400 });
    }
    const ext = path.extname(name).toLowerCase();
    const mimeType = MIME_MAP[ext];
    if (!mimeType) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }
    const filePath = path.join(dir, name);
    if (!path.resolve(filePath).startsWith(path.resolve(dir))) {
      return NextResponse.json({ error: "非法路径" }, { status: 400 });
    }
    try {
      const buf = await fs.readFile(filePath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(buf.length),
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
  }

  // 否则返回图片列表
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const images: ImageInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!MIME_MAP[ext]) continue;

      const filePath = path.join(dir, entry.name);
      const stat = await fs.stat(filePath);
      images.push({
        name: entry.name,
        size: stat.size,
        mimeType: MIME_MAP[ext],
        mtime: stat.mtimeMs,
        url: `/api/hermes/images?name=${entry.name}`,
      });
    }

    images.sort((a, b) => b.mtime - a.mtime);
    return NextResponse.json({ images, count: images.length });
  } catch {
    return NextResponse.json({ images: [], count: 0 });
  }
}

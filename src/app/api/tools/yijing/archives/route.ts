import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src/data/yijing-archives.json");

async function readArchives(): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeArchives(archives: unknown[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(archives, null, 2), "utf-8");
}

export async function GET() {
  const archives = await readArchives();
  return NextResponse.json(archives);
}

export async function POST(request: NextRequest) {
  try {
    const record = await request.json();
    if (!record || !record.id) {
      return NextResponse.json({ error: "缺少记录 ID" }, { status: 400 });
    }
    const archives = await readArchives();
    if (!archives.some((a: any) => a.id === record.id)) {
      archives.unshift(record);
    }
    if (archives.length > 500) {
      archives.length = 500;
    }
    await writeArchives(archives);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少记录 ID" }, { status: 400 });
  }
  const archives = await readArchives();
  const filtered = archives.filter((a: any) => a.id !== id);
  await writeArchives(filtered);
  return NextResponse.json({ ok: true });
}

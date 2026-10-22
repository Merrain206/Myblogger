import { z } from "zod";
import { requireAdmin, requireAdminMutation } from "@/lib/auth/route-auth";
import { deleteArchive, insertArchive, listArchives } from "@/lib/database";
import { parseJsonBody, privateJson } from "@/lib/security/http";
import { archiveRecordSchema } from "@/lib/yijing/schemas";

export const dynamic = "force-dynamic";

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/);

function audit(action: "read" | "create" | "delete", metadata: Record<string, string | number | boolean>) {
  console.info("[security-audit]", JSON.stringify({ actor: "admin", resource: "yijing-archives", action, ...metadata }));
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const archives = listArchives();
    audit("read", { count: archives.length });
    return privateJson(archives);
  } catch {
    return privateJson({ error: "存档服务不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  const body = await parseJsonBody(request, archiveRecordSchema, { maxBytes: 128 * 1024, maxDepth: 12 });
  if (!body.ok) return body.response;

  try {
    const created = insertArchive(body.data);
    audit("create", { id: body.data.id, created });
    return privateJson({ ok: true, created }, { status: created ? 201 : 200 });
  } catch {
    return privateJson({ error: "存档服务不可用" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  const idResult = idSchema.safeParse(new URL(request.url).searchParams.get("id"));
  if (!idResult.success) return privateJson({ error: "记录 ID 无效" }, { status: 400 });

  try {
    const deleted = deleteArchive(idResult.data);
    audit("delete", { id: idResult.data, deleted });
    return privateJson({ ok: true, deleted });
  } catch {
    return privateJson({ error: "存档服务不可用" }, { status: 503 });
  }
}

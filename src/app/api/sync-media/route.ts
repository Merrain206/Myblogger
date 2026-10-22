import { requireAdminMutation } from "@/lib/auth/route-auth";
import { syncHermesMedia } from "@/lib/hermes/sync";
import { privateJson } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireAdminMutation(request);
  if (!auth.ok) return auth.response;
  try {
    const synced = await syncHermesMedia();
    return privateJson({ synced, count: synced.length, timestamp: Date.now() });
  } catch {
    return privateJson(
      { error: "媒体同步服务不可用", synced: [], count: 0, timestamp: Date.now() },
      { status: 503 },
    );
  }
}

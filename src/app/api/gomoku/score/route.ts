import { z } from "zod";
import { listScores } from "@/lib/database";
import { privateJson } from "@/lib/security/http";

export const dynamic = "force-dynamic";

const modeSchema = z.enum(["pvp", "pvai"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const modeValue = params.get("mode");
  const difficultyValue = params.get("difficulty");
  const limitValue = Number(params.get("limit") || 50);
  const mode = modeValue ? modeSchema.safeParse(modeValue) : null;
  const difficulty = difficultyValue ? difficultySchema.safeParse(difficultyValue) : null;
  if ((mode && !mode.success) || (difficulty && !difficulty.success)
    || !Number.isSafeInteger(limitValue) || limitValue < 1 || limitValue > 200) {
    return privateJson({ error: "查询参数无效" }, { status: 400 });
  }

  try {
    const scores = listScores({
      mode: mode?.success ? mode.data : undefined,
      difficulty: difficulty?.success ? difficulty.data : undefined,
      limit: limitValue,
      trusted: true,
    });
    return privateJson(scores);
  } catch {
    return privateJson({ error: "排行榜服务不可用" }, { status: 503 });
  }
}

export async function POST() {
  return privateJson(
    { error: "排行榜只接受游戏服务器确认的在线对局结果" },
    { status: 403 },
  );
}

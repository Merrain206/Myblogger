import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "server", "room-summaries.json");
    const raw = readFileSync(filePath, "utf-8");
    const rooms = JSON.parse(raw);
    return Response.json(rooms);
  } catch {
    return Response.json([
      { roomId: "A", status: "empty", playerCount: 0, countdown: null },
      { roomId: "B", status: "empty", playerCount: 0, countdown: null },
    ]);
  }
}

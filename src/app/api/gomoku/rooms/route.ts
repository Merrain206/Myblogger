import { getRoomSummary, type RoomSummary } from "@/../server/room-store";

export async function GET() {
  const rooms: RoomSummary[] = [
    getRoomSummary("A"),
    getRoomSummary("B"),
  ];

  return Response.json(rooms);
}

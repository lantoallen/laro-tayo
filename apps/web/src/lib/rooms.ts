import { isRoomCode, type GameId } from "@laro/rooms";

/** Where the room server runs. Online play stays hidden when this isn't set. */
export const ROOMS_URL = (process.env.NEXT_PUBLIC_ROOMS_URL ?? "").replace(/\/$/, "");
export const ONLINE_ENABLED = ROOMS_URL !== "";

/** Makes a new room on the server and returns its code. */
export async function createRoom(game: GameId): Promise<string> {
  const response = await fetch(`${ROOMS_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !isRoomCode(data?.code)) {
    throw new Error(typeof data?.error === "string" ? data.error : "Couldn't make a room. Try again.");
  }
  return data.code;
}

export function socketUrl(code: string): string {
  const url = new URL(`${ROOMS_URL}/rooms/${code}/socket`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function roomPath(code: string): string {
  return `/room/${code}`;
}

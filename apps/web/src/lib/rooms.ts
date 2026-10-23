import { isRoomCode, type GameId } from "@laro/rooms";

/** The deployed room server. NEXT_PUBLIC_ROOMS_URL overrides it, and setting that to "" hides online play. */
const DEFAULT_ROOMS_URL = "https://laro-tayo-rooms.lantoallen.workers.dev";

export const ROOMS_URL = (process.env.NEXT_PUBLIC_ROOMS_URL ?? DEFAULT_ROOMS_URL).replace(/\/$/, "");
export const ONLINE_ENABLED = ROOMS_URL !== "";

/** Makes a new room on the server for `players` people, and returns its code. */
export async function createRoom(game: GameId, players = 2): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${ROOMS_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, players }),
    });
  } catch {
    const offline = !navigator.onLine;
    throw new Error(offline ? "You're offline. Playing online needs a connection." : "Couldn't reach the game server.");
  }
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

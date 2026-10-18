import type { Rng } from "@laro/games";
import type { MoveRecord, RoomSnapshot } from "./room";

/** Messages a browser sends to its room. `hello` comes first and says who is connecting. */
export type ClientMessage =
  | { type: "hello"; playerId: string; name: string }
  | { type: "move"; move: unknown }
  | { type: "rematch" };

/** Messages a room sends to each browser. */
export type ServerMessage =
  | { type: "room"; room: RoomSnapshot; lastMove?: MoveRecord }
  | { type: "error"; message: string };

/** Sent as a plain string and answered by the server without waking the room. */
export const PING = "ping";
export const PONG = "pong";

/** Close code for a link to a room that doesn't exist or has expired. */
export const ROOM_NOT_FOUND = 4404;

/** Letters and digits that are hard to mix up when read aloud or typed (no I, L, O, 0, or 1). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 5;
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

export function makeRoomCode(rng: Rng): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)]).join("");
}

export function isRoomCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

/** Player ids are random UUIDs made by the browser. */
export function isPlayerId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9-]{8,64}$/.test(value);
}

export const MAX_NAME_LENGTH = 20;

/** Trims a display name, drops control characters, and keeps it short. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
}

/** Reads a message from a browser. Returns null for anything that isn't a known message. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== "string" || raw.length > 1000) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || !("type" in data)) return null;
  if (data.type === "hello" && "playerId" in data && "name" in data && isPlayerId(data.playerId)) {
    return { type: "hello", playerId: data.playerId, name: cleanName(data.name) || "Player" };
  }
  if (data.type === "move" && "move" in data) return { type: "move", move: data.move };
  if (data.type === "rematch") return { type: "rematch" };
  return null;
}

import type { Seat } from "@laro/games";
import type { DamaEvent } from "@laro/games/dama";
import { who } from "@/components/game/MoveSaid";
import type { Notice } from "@/components/game/parts";
import { squareName } from "./DamaBoard";

const pieces = (count: number) => (count === 1 ? "a piece" : `${count} pieces`);

/**
 * A short message about a move by `seat`. `you` is the seat of whoever is
 * looking at the screen, or null in pass and play, where every message uses names.
 */
function noticeFor(event: DamaEvent, seat: Seat, names: readonly [string, string], you: Seat | null): Notice | null {
  if (event.type === "capture") {
    const count = event.squares.length;
    if (seat === you) return { tone: "good", text: `You captured ${pieces(count)}` };
    return { tone: you === null ? "good" : "bad", text: `${names[seat]} captured ${pieces(count)}` };
  }
  if (event.type === "promote") {
    if (seat === you) return { tone: "good", text: "Your piece is now a king" };
    return { tone: you === null ? "good" : "bad", text: `${names[seat]} got a king` };
  }
  return null;
}

/** The most recent message from a move. */
export function latestNotice(
  events: readonly DamaEvent[],
  seat: Seat | null,
  names: readonly [string, string],
  you: Seat | null,
): Notice | null {
  if (seat === null) return null;
  let notice: Notice | null = null;
  for (const event of events) notice = noticeFor(event, seat, names, you) ?? notice;
  return notice;
}

/** The last move in words for screen readers, like "The bot moved from c3 to e5 and captured a piece." */
export function saidFor(
  events: readonly DamaEvent[],
  seat: Seat | null,
  names: readonly [string, string],
  you: Seat | null,
): string | null {
  const steps = events.flatMap((event) => (event.type === "step" ? [event] : []));
  if (seat === null || steps.length === 0) return null;
  const captured = events.reduce((count, event) => count + (event.type === "capture" ? event.squares.length : 0), 0);
  const king = events.some((event) => event.type === "promote");
  const from = squareName(steps[0].from);
  const to = squareName(steps[steps.length - 1].to);
  return (
    `${who(seat, names, you)} moved from ${from} to ${to}` +
    (captured > 0 ? ` and captured ${pieces(captured)}` : "") +
    (king ? `${captured > 0 ? "," : ""} and got a king` : "") +
    "."
  );
}

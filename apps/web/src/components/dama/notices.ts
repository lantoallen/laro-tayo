import type { Seat } from "@laro/games";
import type { DamaEvent } from "@laro/games/dama";
import type { Notice } from "@/components/game/parts";

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

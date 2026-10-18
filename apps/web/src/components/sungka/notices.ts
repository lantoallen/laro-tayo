import type { Seat } from "@laro/games";
import { storeOf, type SungkaEvent } from "@laro/games/sungka";

export interface Notice {
  tone: "good" | "bad" | "info";
  text: string;
}

export const NOTICE_CLASSES: Record<Notice["tone"] | "none", string> = {
  good: "bg-yellow text-yellow-ink",
  bad: "border border-red text-red",
  info: "bg-surface",
  none: "bg-surface",
};

/**
 * A short message about something that happened during a move. `you` is the seat
 * of whoever is looking at the screen, so their own moves read "You go again".
 * In pass and play both players share the screen, so `you` is null and every
 * message uses names.
 */
export function noticeFor(event: SungkaEvent, names: readonly [string, string], you: Seat | null): Notice | null {
  switch (event.type) {
    case "capture": {
      const seat = event.store === storeOf(0) ? 0 : 1;
      if (seat === you) return { tone: "good", text: `Captured! +${event.count} shells` };
      return { tone: you === null ? "good" : "bad", text: `${names[seat]} captured ${event.count} shells` };
    }
    case "extraTurn":
      if (event.seat === you) return { tone: "good", text: "You go again" };
      return { tone: you === null ? "good" : "bad", text: `${names[event.seat]} goes again` };
    case "pass":
      if (event.seat === you) return { tone: "info", text: "You have no shells, so your turn is skipped" };
      if (you !== null) return { tone: "good", text: `${names[event.seat]} has no shells, so you go again` };
      return { tone: "info", text: `${names[event.seat]} has no shells, so their turn is skipped` };
    default:
      return null;
  }
}

/** The most recent message from a move. */
export function latestNotice(
  events: readonly SungkaEvent[],
  names: readonly [string, string],
  you: Seat | null,
): Notice | null {
  let notice: Notice | null = null;
  for (const event of events) notice = noticeFor(event, names, you) ?? notice;
  return notice;
}

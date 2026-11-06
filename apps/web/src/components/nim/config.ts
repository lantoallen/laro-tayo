import type { Seat } from "@laro/games";
import { nim, type NimMove, type NimState } from "@laro/games/nim";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import type { Notice } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import { NimBoard } from "./NimBoard";
import { Rules } from "./Rules";

const sticks = (count: number) => (count === 1 ? "1 stick" : `${count} sticks`);

function notice(state: NimState, names: readonly string[]): Notice | null {
  const last = state.last;
  if (!last) return null;
  return { tone: "info", text: `${names[last.seat]} took ${sticks(last.count)} from pile ${last.pile + 1}` };
}

/** The last move in words, like "The bot took 2 sticks from pile 3, leaving 1." */
function said(state: NimState, names: readonly string[], you: Seat | null): string | null {
  const last = state.last;
  if (!last) return null;
  const left = state.piles[last.pile];
  return `${who(last.seat, names, you)} took ${sticks(last.count)} from pile ${last.pile + 1}, leaving ${left}.`;
}

export const NIM: BoardGameConfig<NimState, NimMove> = {
  game: nim,
  said,
  href: "/nim",
  roomId: "nim",
  tagline: "Take sticks from a pile. Whoever takes the last one wins.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  Board: NimBoard,
  Rules,
  stat: { label: "Taken", value: (state, seat) => state.taken[seat] },
  prompt: "Tap a stick to take it and the ones after it.",
  notice,
  resultDetail: (state) => `Took the last stick on move ${state.turns}.`,
  sound: () => "place",
};

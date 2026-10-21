import type { Seat } from "@laro/games";
import { canFly, morris, otherSeat, piecesLeft, type MorrisMove, type MorrisState } from "@laro/games/morris";
import type { BoardGameConfig } from "@/components/board-game/types";
import { SEAT_COLORS } from "@/components/game/settings";
import type { Notice } from "@/components/game/parts";
import { MorrisBoard } from "./MorrisBoard";
import { Rules } from "./Rules";

function prompt(state: MorrisState): string {
  const seat = state.turn ?? 0;
  if (state.taking) return "Take one of their pieces.";
  const toPlace = state.inHand[seat];
  if (toPlace > 0) return `Place a piece. ${toPlace} left to place.`;
  return canFly(state, seat) ? "Move a piece to any empty point." : "Move a piece along a line.";
}

/** Says when the other player made a mill, or when a piece was just taken. */
function notice(state: MorrisState, names: readonly [string, string], you: Seat | null): Notice | null {
  if (state.taking && state.turn !== null && state.turn !== you) {
    // In pass and play this is also the only hint that a piece has to be taken.
    if (you === null) {
      const text = `${names[state.turn]} made a mill. Take one of ${names[otherSeat(state.turn)]}'s pieces.`;
      return { tone: "good", text };
    }
    return { tone: "bad", text: `${names[state.turn]} made a mill` };
  }
  const last = state.last;
  if (!last || last.taken === null || state.turn === null) return null;
  if (last.seat === you) return { tone: "good", text: "You took a piece" };
  const whose = you === null ? `${names[otherSeat(last.seat)]}'s` : "your";
  return { tone: you === null ? "good" : "bad", text: `${names[last.seat]} took one of ${whose} pieces` };
}

export const MORRIS: BoardGameConfig<MorrisState, MorrisMove> = {
  game: morris,
  href: "/nine-mens-morris",
  roomId: "morris",
  tagline: "Make lines of three to take the other player's pieces.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  Board: MorrisBoard,
  Rules,
  stat: { label: "Pieces", value: piecesLeft },
  prompt,
  notice,
  resultDetail: (state, names) =>
    state.winner === null
      ? "50 moves went by without a piece being taken."
      : `Pieces left: ${names[0]} ${piecesLeft(state, 0)}, ${names[1]} ${piecesLeft(state, 1)}`,
  // A mill rings out, and taking a piece knocks it off the board.
  sound: (state) => (state.taking ? "match" : state.last?.taken != null ? "capture" : "place"),
};

import type { Seat } from "@laro/games";
import { countDiscs, otherSeat, reversi, type ReversiMove, type ReversiState } from "@laro/games/reversi";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import { SEAT_COLORS } from "@/components/game/settings";
import type { Notice } from "@/components/game/parts";
import { ReversiBoard, squareName } from "./ReversiBoard";
import { Rules } from "./Rules";

/** Says when someone had to pass, since the same player then goes twice in a row. */
function notice(state: ReversiState, names: readonly string[], you: Seat | null): Notice | null {
  if (state.passed === null) return null;
  const goesAgain = otherSeat(state.passed);
  const who = state.passed === you ? "You have" : `${names[state.passed]} has`;
  const next = goesAgain === you ? "You go again." : `${names[goesAgain]} goes again.`;
  return { tone: "info", text: `${who} no moves. ${next}` };
}

/** The last disc in words, like "The bot played d3 and flipped 2 discs." */
function said(state: ReversiState, names: readonly string[], you: Seat | null): string | null {
  if (!state.last) return null;
  const { seat, square, flipped } = state.last;
  const discs = flipped.length === 1 ? "1 disc" : `${flipped.length} discs`;
  return `${who(seat, names, you)} played ${squareName(square)} and flipped ${discs}.`;
}

export const REVERSI: BoardGameConfig<ReversiState, ReversiMove> = {
  game: reversi,
  said,
  href: "/reversi",
  roomId: "reversi",
  tagline: "Trap the other player's discs to flip them to your color.",
  colors: ["Black", "White"],
  swatches: [SEAT_COLORS.black, SEAT_COLORS.white],
  Board: ReversiBoard,
  Rules,
  stat: { label: "Discs", value: (state, seat) => countDiscs(state.board, seat) },
  prompt: "Tap a yellow dot.",
  notice,
  resultDetail: (state, names) =>
    `Discs: ${names[0]} ${countDiscs(state.board, 0)}, ${names[1]} ${countDiscs(state.board, 1)}`,
  // A big flip gets a bigger sound.
  sound: (state) => ((state.last?.flipped.length ?? 0) >= 4 ? "capture" : "place"),
};

import type { Seat } from "@laro/games";
import { countDiscs, otherSeat, reversi, type ReversiMove, type ReversiState } from "@laro/games/reversi";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { ReversiBoard } from "./ReversiBoard";
import { Rules } from "./Rules";

/** Says when someone had to pass, since the same player then goes twice in a row. */
function notice(state: ReversiState, names: readonly [string, string], you: Seat | null): Notice | null {
  if (state.passed === null) return null;
  const goesAgain = otherSeat(state.passed);
  const who = state.passed === you ? "You have" : `${names[state.passed]} has`;
  const next = goesAgain === you ? "You go again." : `${names[goesAgain]} goes again.`;
  return { tone: "info", text: `${who} no moves. ${next}` };
}

export const REVERSI: BoardGameConfig<ReversiState, ReversiMove> = {
  game: reversi,
  href: "/reversi",
  tagline: "Trap the other player's discs to flip them to your color.",
  colors: ["Black", "White"],
  Board: ReversiBoard,
  Rules,
  stat: { label: "Discs", value: (state, seat) => countDiscs(state.board, seat) },
  prompt: "Tap a yellow dot.",
  notice,
  resultDetail: (state, names) =>
    `Discs: ${names[0]} ${countDiscs(state.board, 0)}, ${names[1]} ${countDiscs(state.board, 1)}`,
};

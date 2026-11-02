import type { Seat } from "@laro/games";
import { colOf, countDiscs, fourInARow, type FourMove, type FourState } from "@laro/games/four-in-a-row";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import { SEAT_COLORS } from "@/components/game/settings";
import { FourBoard } from "./FourBoard";
import { Rules } from "./Rules";

/** Each player has 21 discs, half of the 42 spaces. */
const DISCS_EACH = 21;

/** The last disc in words, like "The bot dropped a disc in column 4." */
function said(state: FourState, names: readonly string[], you: Seat | null): string | null {
  if (state.last === null) return null;
  return `${who(state.board[state.last]!, names, you)} dropped a disc in column ${colOf(state.last) + 1}.`;
}

export const FOUR_IN_A_ROW: BoardGameConfig<FourState, FourMove> = {
  game: fourInARow,
  said,
  href: "/four-in-a-row",
  roomId: "four-in-a-row",
  tagline: "Drop discs and line up four before the other player does.",
  colors: ["Red", "Yellow"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.yellow],
  Board: FourBoard,
  Rules,
  stat: { label: "Discs left", value: (state, seat) => DISCS_EACH - countDiscs(state.board, seat) },
  prompt: "Pick a column.",
  resultDetail: (state) =>
    state.winner === null ? "The board filled up with no four in a row." : `Four in a row after ${state.turns} moves.`,
  sound: () => "place",
};

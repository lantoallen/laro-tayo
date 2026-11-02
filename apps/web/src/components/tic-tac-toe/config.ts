import type { Seat } from "@laro/games";
import { ticTacToe, type TicTacToeMove, type TicTacToeState } from "@laro/games/tic-tac-toe";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import { SEAT_COLORS } from "@/components/game/settings";
import { Rules } from "./Rules";
import { TicTacToeBoard } from "./TicTacToeBoard";

/** The last mark in words, like "The bot took row 2, column 3." */
function said(state: TicTacToeState, names: readonly string[], you: Seat | null): string | null {
  if (state.last === null) return null;
  const seat = state.board[state.last]!;
  return `${who(seat, names, you)} took row ${Math.floor(state.last / 3) + 1}, column ${(state.last % 3) + 1}.`;
}

export const TIC_TAC_TOE: BoardGameConfig<TicTacToeState, TicTacToeMove> = {
  game: ticTacToe,
  said,
  href: "/tic-tac-toe",
  roomId: "tic-tac-toe",
  tagline: "Get three in a row before the other player does.",
  colors: ["X", "O"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  Board: TicTacToeBoard,
  Rules,
  stat: { label: "Marks", value: (state, seat) => state.board.filter((mark) => mark === seat).length },
  prompt: "Tap an empty square.",
  resultDetail: (state) =>
    state.winner === null ? "Nobody got three in a row." : `Three in a row in ${state.turns} moves.`,
  sound: () => "place",
};

import { ticTacToe, type TicTacToeMove, type TicTacToeState } from "@laro/games/tic-tac-toe";
import type { BoardGameConfig } from "@/components/board-game/types";
import { SEAT_COLORS } from "@/components/game/settings";
import { Rules } from "./Rules";
import { TicTacToeBoard } from "./TicTacToeBoard";

export const TIC_TAC_TOE: BoardGameConfig<TicTacToeState, TicTacToeMove> = {
  game: ticTacToe,
  href: "/tic-tac-toe",
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

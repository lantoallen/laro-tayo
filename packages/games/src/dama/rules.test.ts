import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError, type Seat } from "../engine/types";
import {
  DRAW_AFTER_QUIET_MOVES,
  SQUARES,
  applyEvent,
  countPieces,
  isDark,
  legalMoves,
  play,
  result,
  setup,
  type DamaMove,
  type DamaState,
  type Piece,
} from "./rules";

/** The square at a row and column, counting from the top left. */
const sq = (row: number, col: number) => row * 8 + col;

function stateWith(pieces: [number, Piece][], turn: Seat = 0, quietMoves = 0): DamaState {
  const board = Array<Piece>(SQUARES).fill(0);
  for (const [square, piece] of pieces) board[square] = piece;
  return { board, turn, winner: null, quietMoves, turns: 0 };
}

const sorted = (moves: DamaMove[]) => moves.map((m) => m.join(",")).sort();

/** The same position seen from the other side: the board turned around and the colors swapped. */
function turnAround(board: readonly Piece[]): Piece[] {
  return board.map((_, i) => -board[SQUARES - 1 - i] as Piece);
}

describe("setup", () => {
  it("puts 12 men on the dark squares of each side's first three rows", () => {
    const state = setup();
    expect(countPieces(state.board, 0)).toBe(12);
    expect(countPieces(state.board, 1)).toBe(12);
    state.board.forEach((piece, square) => {
      if (piece !== 0) expect(isDark(square)).toBe(true);
    });
    expect(state.board[sq(7, 0)]).toBe(1);
    expect(state.board[sq(0, 1)]).toBe(-1);
    expect(state.turn).toBe(0);
  });

  it("gives the first player 7 opening moves", () => {
    expect(legalMoves(setup(), 0)).toHaveLength(7);
    expect(legalMoves(setup(), 1)).toEqual([]);
  });
});

describe("moving", () => {
  it("moves men one square diagonally forward", () => {
    const state = stateWith([[sq(4, 3), 1]]);
    expect(sorted(legalMoves(state, 0))).toEqual(sorted([[sq(4, 3), sq(3, 2)], [sq(4, 3), sq(3, 4)]]));
  });

  it("lets kings move any distance diagonally", () => {
    const state = stateWith([[sq(7, 0), 2]]);
    expect(legalMoves(state, 0)).toHaveLength(7);
  });
});

describe("capturing", () => {
  it("makes you capture when you can", () => {
    const state = stateWith([
      [sq(5, 2), 1],
      [sq(6, 7), 1],
      [sq(4, 3), -1],
    ]);
    expect(legalMoves(state, 0)).toEqual([[sq(5, 2), sq(3, 4)]]);
  });

  it("lets men capture backward", () => {
    const state = stateWith([
      [sq(3, 2), 1],
      [sq(4, 3), -1],
    ]);
    expect(legalMoves(state, 0)).toEqual([[sq(3, 2), sq(5, 4)]]);
  });

  it("chains jumps and removes every captured piece at the end", () => {
    const state = stateWith([
      [sq(6, 1), 1],
      [sq(5, 2), -1],
      [sq(3, 4), -1],
      [sq(0, 7), -1],
    ]);
    const { state: next, events } = play(state, 0, [sq(6, 1), sq(4, 3), sq(2, 5)]);
    expect(next.board[sq(2, 5)]).toBe(1);
    expect(next.board[sq(5, 2)]).toBe(0);
    expect(next.board[sq(3, 4)]).toBe(0);
    expect(events).toContainEqual({ type: "capture", squares: [sq(5, 2), sq(3, 4)] });
  });

  it("makes you take the line that captures the most pieces", () => {
    const state = stateWith([
      [sq(6, 1), 1],
      [sq(5, 2), -1],
      [sq(3, 4), -1],
      [sq(6, 5), 1],
      [sq(5, 6), -1],
    ]);
    expect(legalMoves(state, 0)).toEqual([[sq(6, 1), sq(4, 3), sq(2, 5)]]);
  });

  it("lets kings capture from a distance and stop on any empty square past the piece", () => {
    const state = stateWith([
      [sq(7, 0), 2],
      [sq(4, 3), -1],
    ]);
    expect(sorted(legalMoves(state, 0))).toEqual(
      sorted([3, 2, 1, 0].map((row) => [sq(7, 0), sq(row, 7 - row)])),
    );
  });

  it("doesn't let kings jump two pieces in a row or their own pieces", () => {
    const twoInARow = stateWith([
      [sq(7, 0), 2],
      [sq(4, 3), -1],
      [sq(3, 4), -1],
    ]);
    expect(legalMoves(twoInARow, 0).every((move) => move.length === 2 && move[1] > sq(4, 3))).toBe(true);

    const ownPiece = stateWith([
      [sq(7, 0), 2],
      [sq(5, 2), 1],
      [sq(4, 3), -1],
    ]);
    expect(legalMoves(ownPiece, 0).some((move) => move[0] === sq(7, 0) && move[1] === sq(3, 4))).toBe(false);
  });
});

describe("crowning", () => {
  it("crowns a man that ends its move on the far row", () => {
    const { state, events } = play(stateWith([[sq(1, 2), 1], [sq(7, 0), -1]]), 0, [sq(1, 2), sq(0, 1)]);
    expect(state.board[sq(0, 1)]).toBe(2);
    expect(events).toContainEqual({ type: "promote", square: sq(0, 1) });
  });

  it("doesn't crown a man that only passes through the far row while capturing", () => {
    const state = stateWith([
      [sq(2, 1), 1],
      [sq(1, 2), -1],
      [sq(1, 4), -1],
      [sq(7, 6), -1],
    ]);
    expect(legalMoves(state, 0)).toEqual([[sq(2, 1), sq(0, 3), sq(2, 5)]]);
    const { state: next } = play(state, 0, [sq(2, 1), sq(0, 3), sq(2, 5)]);
    expect(next.board[sq(2, 5)]).toBe(1);
  });
});

describe("ending the game", () => {
  it("wins when the other side has no pieces left", () => {
    const { state } = play(stateWith([[sq(5, 2), 1], [sq(4, 3), -1]]), 0, [sq(5, 2), sq(3, 4)]);
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [1, 0] });
  });

  it("wins when the other side can't move", () => {
    const state = stateWith([
      [sq(6, 1), -1],
      [sq(7, 0), 1],
      [sq(7, 2), 1],
      [sq(5, 0), 1],
      [sq(5, 2), 1],
      [sq(4, 3), 1],
      [sq(2, 7), 1],
    ]);
    const { state: next } = play(state, 0, [sq(2, 7), sq(1, 6)]);
    expect(next.turn).toBeNull();
    expect(next.winner).toBe(0);
  });

  it("calls a draw after a long run of king moves with no captures", () => {
    const state = stateWith(
      [
        [sq(7, 0), 2],
        [sq(0, 7), -2],
      ],
      0,
      DRAW_AFTER_QUIET_MOVES - 1,
    );
    const { state: next, events } = play(state, 0, [sq(7, 0), sq(6, 1)]);
    expect(next.turn).toBeNull();
    expect(result(next)).toEqual({ winners: [], scores: [1, 1] });
    expect(events.at(-1)).toEqual({ type: "gameOver", winner: null });
  });

  it("resets the draw count when a man moves", () => {
    const state = stateWith(
      [
        [sq(6, 1), 1],
        [sq(0, 7), -2],
      ],
      0,
      DRAW_AFTER_QUIET_MOVES - 1,
    );
    expect(play(state, 0, [sq(6, 1), sq(5, 0)]).state.quietMoves).toBe(0);
  });
});

describe("play", () => {
  it.each([
    ["it isn't your turn", setup({ firstSeat: 1 }), [sq(5, 0), sq(4, 1)]],
    ["the move isn't legal", setup(), [sq(5, 0), sq(3, 2)]],
    ["the move isn't a list of squares", setup(), "5,0" as unknown as DamaMove],
    ["the move has no landing square", setup(), [sq(5, 0)]],
  ])("rejects a move when %s", (_, state, move) => {
    expect(() => play(state, 0, move)).toThrow(IllegalMoveError);
  });
});

describe("random games", () => {
  it("work the same for both sides, replay from their events, and always end", () => {
    const rng = createRng(31);
    for (let game = 0; game < 150; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        expect(state.turns).toBeLessThan(400);
        const seat = state.turn;
        const moves = legalMoves(state, seat);

        // Seen from the other side, the other seat has the same moves.
        const turned: DamaState = { ...state, board: turnAround(state.board), turn: (1 - seat) as Seat };
        expect(sorted(legalMoves(turned, (1 - seat) as Seat))).toEqual(
          sorted(moves.map((move) => move.map((square) => SQUARES - 1 - square))),
        );

        const before = [countPieces(state.board, 0), countPieces(state.board, 1)];
        const outcome = play(state, seat, pick(rng, moves));
        expect(outcome.events.reduce(applyEvent, state.board)).toEqual(outcome.state.board);
        expect(countPieces(outcome.state.board, 0)).toBeLessThanOrEqual(before[0]);
        expect(countPieces(outcome.state.board, 1)).toBeLessThanOrEqual(before[1]);
        state = outcome.state;
      }
      expect(result(state)).not.toBeNull();
    }
  });
});

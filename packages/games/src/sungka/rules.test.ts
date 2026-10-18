import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError, type Seat } from "../engine/types";
import {
  BOARD_SIZE,
  TOTAL_SHELLS,
  applyEvent,
  legalMoves,
  play,
  result,
  setup,
  type SungkaEvent,
  type SungkaState,
} from "./rules";

function stateWith(slots: Record<number, number>, turn: Seat | null = 0): SungkaState {
  const board = Array<number>(BOARD_SIZE).fill(0);
  for (const [slot, count] of Object.entries(slots)) board[Number(slot)] = count;
  return { board, turn, turns: 0 };
}

const sum = (board: readonly number[]) => board.reduce((total, n) => total + n, 0);
const drops = (events: SungkaEvent[]) => events.flatMap((e) => (e.type === "drop" ? [e.slot] : []));

/** The same position seen from the other side: seat 1's houses become seat 0's. */
function swapSides(board: readonly number[]): number[] {
  return board.map((_, i) => board[(i + 8) % BOARD_SIZE]);
}

describe("setup", () => {
  it("puts 7 shells in every house and none in the stores", () => {
    const state = setup();
    expect(state.board).toEqual([7, 7, 7, 7, 7, 7, 7, 0, 7, 7, 7, 7, 7, 7, 7, 0]);
    expect(sum(state.board)).toBe(TOTAL_SHELLS);
    expect(state.turn).toBe(0);
  });

  it("lets either seat go first", () => {
    expect(setup({ firstSeat: 1 }).turn).toBe(1);
  });

  it("only allows two players", () => {
    expect(() => setup({ seats: 3 })).toThrow();
  });
});

describe("legalMoves", () => {
  it("lists the houses with shells on the moving player's side", () => {
    expect(legalMoves(setup(), 0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(legalMoves(stateWith({ 1: 2, 4: 1, 9: 3 }), 0)).toEqual([1, 4]);
  });

  it("is empty when it isn't that seat's turn", () => {
    expect(legalMoves(setup(), 1)).toEqual([]);
  });
});

describe("play", () => {
  it("drops one shell per slot and skips the other player's store", () => {
    const { state, events } = play(stateWith({ 6: 10 }), 0, 6);
    expect(drops(events)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 0, 1]);
    expect(state.board[15]).toBe(0);
  });

  it("gives another turn when the last shell lands in your store", () => {
    const { state, events } = play(stateWith({ 4: 3, 10: 1 }), 0, 4);
    expect(state.board.slice(4, 8)).toEqual([0, 1, 1, 1]);
    expect(state.turn).toBe(0);
    expect(events.at(-1)).toEqual({ type: "extraTurn", seat: 0 });
  });

  it("keeps sowing from a house that already had shells", () => {
    const { state, events } = play(stateWith({ 0: 2, 2: 3, 8: 5, 10: 1 }), 0, 0);
    expect(events.filter((e) => e.type === "pickup")).toEqual([
      { type: "pickup", slot: 0, count: 2 },
      { type: "pickup", slot: 2, count: 4 },
    ]);
    // The second handful ends in empty house 6, which captures house 8 across from it.
    expect(state.board).toEqual(stateWith({ 1: 1, 3: 1, 4: 1, 5: 1, 7: 6, 10: 1 }).board);
    expect(state.turn).toBe(1);
  });

  it("captures the house across when the last shell lands in your own empty house", () => {
    const { state, events } = play(stateWith({ 6: 10 }), 0, 6);
    expect(events).toContainEqual({ type: "capture", from: [1, 13], store: 7, count: 2 });
    expect(state.board[1]).toBe(0);
    expect(state.board[13]).toBe(0);
    expect(state.board[7]).toBe(3);
  });

  it("still moves the last shell to the store when the house across is empty", () => {
    const { state } = play(stateWith({ 2: 1, 9: 4 }), 0, 2);
    expect(state.board).toEqual(stateWith({ 7: 1, 9: 4 }).board);
    expect(state.turn).toBe(1);
  });

  it("ends the turn when the last shell lands in an empty house on the other side", () => {
    const { state } = play(stateWith({ 6: 2, 12: 1 }), 0, 6);
    expect(state.board).toEqual(stateWith({ 7: 1, 8: 1, 12: 1 }).board);
    expect(state.turn).toBe(1);
  });

  it("skips a player with no shells on their side", () => {
    const { state, events } = play(stateWith({ 0: 1, 3: 2 }), 0, 0);
    expect(state.turn).toBe(0);
    expect(events.at(-1)).toEqual({ type: "pass", seat: 1 });
  });

  it("passes the bonus turn on when the player has no shells left", () => {
    const { state, events } = play(stateWith({ 6: 1, 10: 2 }), 0, 6);
    expect(state.turn).toBe(1);
    expect(events).not.toContainEqual({ type: "extraTurn", seat: 0 });
    expect(events.at(-1)).toEqual({ type: "pass", seat: 0 });
  });

  it("ends the game once every shell is in a store", () => {
    const { state, events } = play(stateWith({ 6: 1, 7: 50, 15: 47 }), 0, 6);
    expect(state.turn).toBeNull();
    expect(events.at(-1)).toEqual({ type: "gameOver" });
    expect(result(state)).toEqual({ winners: [0], scores: [51, 47] });
  });

  it("works the same for seat 1", () => {
    const rng = createRng(7);
    let position = setup();
    for (let i = 0; i < 40 && position.turn !== null; i++) {
      if (position.turn === 0) {
        const mirrored: SungkaState = { ...position, board: swapSides(position.board), turn: 1 };
        for (const house of legalMoves(position, 0)) {
          const asSeat0 = play(position, 0, house).state;
          const asSeat1 = play(mirrored, 1, house + 8).state;
          expect(asSeat1.board).toEqual(swapSides(asSeat0.board));
          expect(asSeat1.turn).toBe(asSeat0.turn === null ? null : 1 - asSeat0.turn);
        }
      }
      position = play(position, position.turn, pick(rng, legalMoves(position, position.turn))).state;
    }
  });

  it.each([
    ["it isn't your turn", stateWith({ 0: 1, 8: 1 }, 1), 0, 0],
    ["the house is on the other side", stateWith({ 0: 1, 8: 1 }), 0, 8],
    ["the slot is a store", stateWith({ 0: 1, 7: 3 }), 0, 7],
    ["the house is empty", stateWith({ 0: 1 }), 0, 3],
    ["the house doesn't exist", stateWith({ 0: 1 }), 0, 1.5],
    ["the game is over", stateWith({ 7: 49, 15: 49 }, null), 0, 0],
  ])("rejects a move when %s", (_, state, seat, house) => {
    expect(() => play(state, seat, house)).toThrow(IllegalMoveError);
  });

  it("doesn't change the state it was given", () => {
    const before = setup();
    const copy = structuredClone(before);
    play(before, 0, 3);
    expect(before).toEqual(copy);
  });
});

describe("result", () => {
  it("is null while the game is still going", () => {
    expect(result(setup())).toBeNull();
  });

  it("calls a tie a draw", () => {
    expect(result(stateWith({ 7: 49, 15: 49 }, null))).toEqual({ winners: [], scores: [49, 49] });
  });
});

describe("random games", () => {
  it("never lose shells, replay exactly from their events, and always finish", () => {
    const rng = createRng(2026);
    for (let game = 0; game < 300; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        expect(state.turns).toBeLessThan(TOTAL_SHELLS);
        const moves = legalMoves(state, state.turn);
        expect(moves.length).toBeGreaterThan(0);

        const outcome = play(state, state.turn, pick(rng, moves));
        const replayed = outcome.events.reduce(applyEvent, state.board);
        expect(replayed).toEqual(outcome.state.board);
        expect(sum(outcome.state.board)).toBe(TOTAL_SHELLS);
        expect(outcome.state.board.every((n) => n >= 0)).toBe(true);
        state = outcome.state;
      }
      const final = result(state);
      expect(final).not.toBeNull();
      expect(final!.scores[0] + final!.scores[1]).toBe(TOTAL_SHELLS);
    }
  });
});

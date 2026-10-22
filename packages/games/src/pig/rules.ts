import { newSeed, rollDie, type Rng } from "../engine/rng";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** Points needed to win. */
export const GOAL = 100;

export interface LastAction {
  seat: Seat;
  action: PigMove;
  /** The roll, for a roll. */
  roll: number | null;
  /** True when the roll was a 1 and the turn's points were lost. */
  bust: boolean;
  /** Points banked by a hold. */
  banked: number;
  /** Points lost to a 1. */
  lost: number;
}

export interface PigState {
  scores: [number, number];
  /** Points rolled so far this turn, not banked yet. */
  turnTotal: number;
  /** Whose turn it is, or null once someone reaches the goal. */
  turn: Seat | null;
  winner: Seat | null;
  /** Where the next roll comes from. A player's view leaves it out, so nobody can tell what's coming. */
  seed: number;
  last: LastAction | null;
  turns: number;
}

/** Roll again, or bank this turn's points and pass the die. */
export type PigMove = "roll" | "hold";

export type PigEvent =
  | { type: "roll"; roll: number }
  | { type: "bust" }
  | { type: "hold"; banked: number }
  | { type: "gameOver"; winner: Seat };

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): PigState {
  const { seats = 2, firstSeat = 0, rng = Math.random } = options;
  if (seats !== 2) throw new Error("Pig is played by exactly 2 players here");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Pig`);
  return { scores: [0, 0], turnTotal: 0, turn: firstSeat, winner: null, seed: newSeed(rng), last: null, turns: 0 };
}

export function legalMoves(state: PigState, seat: Seat): PigMove[] {
  if (state.turn !== seat) return [];
  return state.turnTotal > 0 ? ["roll", "hold"] : ["roll"];
}

const withScore = (scores: [number, number], seat: Seat, score: number): [number, number] =>
  seat === 0 ? [score, scores[1]] : [scores[0], score];

/**
 * A roll of 2 to 6 adds to the turn's points. A 1 loses them and ends the
 * turn. Holding banks them. Reaching the goal wins straight away.
 */
export function play(state: PigState, seat: Seat, move: PigMove): MoveOutcome<PigState, PigEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!legalMoves(state, seat).includes(move)) throw new IllegalMoveError(`You can't ${JSON.stringify(move)} now`);
  const turns = state.turns + 1;

  if (move === "hold") {
    const banked = state.turnTotal;
    const scores = withScore(state.scores, seat, state.scores[seat] + banked);
    const last: LastAction = { seat, action: "hold", roll: null, bust: false, banked, lost: 0 };
    return {
      state: { ...state, scores, turnTotal: 0, turn: otherSeat(seat), last, turns },
      events: [{ type: "hold", banked }],
    };
  }

  const { roll, seed } = rollDie(state.seed);
  if (roll === 1) {
    const last: LastAction = { seat, action: "roll", roll, bust: true, banked: 0, lost: state.turnTotal };
    return {
      state: { ...state, turnTotal: 0, turn: otherSeat(seat), seed, last, turns },
      events: [{ type: "roll", roll }, { type: "bust" }],
    };
  }
  const turnTotal = state.turnTotal + roll;
  const last: LastAction = { seat, action: "roll", roll, bust: false, banked: 0, lost: 0 };
  if (state.scores[seat] + turnTotal >= GOAL) {
    const scores = withScore(state.scores, seat, state.scores[seat] + turnTotal);
    return {
      state: { ...state, scores, turnTotal: 0, turn: null, winner: seat, seed, last, turns },
      events: [
        { type: "roll", roll },
        { type: "gameOver", winner: seat },
      ],
    };
  }
  return { state: { ...state, turnTotal, seed, last, turns }, events: [{ type: "roll", roll }] };
}

/** What a player may see: everything but the seed, which would give away the next roll. */
export function view(state: PigState): PigState {
  return { ...state, seed: 0 };
}

export function result(state: PigState): GameResult | null {
  if (state.winner === null) return null;
  return { winners: [state.winner], scores: [...state.scores] };
}

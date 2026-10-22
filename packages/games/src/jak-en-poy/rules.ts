import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** Rounds to win the match: best of five. */
export const TARGET = 3;
export const CHOICES = ["rock", "paper", "scissors"] as const;

export type Choice = (typeof CHOICES)[number];
/** A pick in a player's view: their own, "hidden" for the other player's until both have picked, or null. */
export type Pick = Choice | "hidden" | null;

export interface Round {
  picks: [Choice, Choice];
  /** The seat that won the round, or null for a tie. */
  winner: Seat | null;
}

export interface JakState {
  /** This round's picks so far. */
  picks: [Pick, Pick];
  /** Rounds won. */
  scores: [number, number];
  /** Who picks first each round. Picks stay hidden, so going first gives nothing away. */
  lead: Seat;
  /** Whose pick is still needed, or null once the match is over. */
  turn: Seat | null;
  winner: Seat | null;
  /** Every round so far, the latest last. */
  rounds: Round[];
  turns: number;
}

export type JakMove = Choice;

export type JakEvent =
  | { type: "pick"; seat: Seat }
  | { type: "round"; picks: [Choice, Choice]; winner: Seat | null }
  | { type: "gameOver"; winner: Seat };

/** What each choice beats. */
export const BEATS: Readonly<Record<Choice, Choice>> = { rock: "scissors", paper: "rock", scissors: "paper" };

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): JakState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Jak-en-poy is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Jak-en-poy`);
  return { picks: [null, null], scores: [0, 0], lead: firstSeat, turn: firstSeat, winner: null, rounds: [], turns: 0 };
}

export function legalMoves(state: JakState, seat: Seat): JakMove[] {
  return state.turn === seat ? [...CHOICES] : [];
}

/** The winner of one round, or null for a tie. */
export function roundWinner([first, second]: readonly [Choice, Choice]): Seat | null {
  if (first === second) return null;
  return BEATS[first] === second ? 0 : 1;
}

/**
 * Records a pick. Once both players have picked, the round is decided and a
 * new one starts. A tie doesn't count. The first to win three rounds wins.
 */
export function play(state: JakState, seat: Seat, move: JakMove): MoveOutcome<JakState, JakEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!CHOICES.includes(move)) throw new IllegalMoveError(`There's no ${JSON.stringify(move)} in Jak-en-poy`);

  const picks: [Pick, Pick] = seat === 0 ? [move, state.picks[1]] : [state.picks[0], move];
  const events: JakEvent[] = [{ type: "pick", seat }];
  const turns = state.turns + 1;
  const other = otherSeat(seat);
  if (picks[other] === null) {
    return { state: { ...state, picks, turn: other, turns }, events };
  }

  const both = picks as [Choice, Choice];
  const winner = roundWinner(both);
  const scores: [number, number] = [...state.scores];
  if (winner !== null) scores[winner]++;
  events.push({ type: "round", picks: both, winner });
  const matchWinner = scores.findIndex((score) => score >= TARGET);
  const over = matchWinner !== -1;
  if (over) events.push({ type: "gameOver", winner: matchWinner });
  return {
    state: {
      ...state,
      picks: [null, null],
      scores,
      turn: over ? null : state.lead,
      winner: over ? matchWinner : null,
      rounds: [...state.rounds, { picks: both, winner }],
      turns,
    },
    events,
  };
}

/** What one seat may see: the other player's pick stays hidden until the round is decided. */
export function view(state: JakState, seat: Seat | null): JakState {
  const picks = state.picks.map((pick, s) => (s === seat || pick === null ? pick : "hidden")) as [Pick, Pick];
  return { ...state, picks };
}

export function result(state: JakState): GameResult | null {
  if (state.winner === null) return null;
  return { winners: [state.winner], scores: [...state.scores] };
}

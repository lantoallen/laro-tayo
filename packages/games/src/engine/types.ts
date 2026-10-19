import type { Rng } from "./rng";

/** A place at the table. Seats are numbered from 0. */
export type Seat = number;

export type BotLevel = "easy" | "medium" | "hard";

export interface GameResult {
  /** Seats that won. Empty when the game is a draw. */
  winners: Seat[];
  /** Final score for each seat, indexed by seat. */
  scores: number[];
}

export interface MoveOutcome<State, Event> {
  state: State;
  /** What happened during the move, in order, so screens can animate it. */
  events: Event[];
}

export interface BotOptions {
  level: BotLevel;
  rng: Rng;
}

/**
 * The contract every game in Laro Tayo follows. Rooms, bots, and screens only
 * talk to games through this, so adding a game doesn't touch the shared code.
 */
export interface Game<State, Move, Event, View = State> {
  id: string;
  name: string;
  minSeats: number;
  maxSeats: number;
  /** `rng` shuffles anything random at the start, like a deck of cards. */
  setup(options: { seats: number; firstSeat?: Seat; rng?: Rng }): State;
  /** Whose turn it is, or null once the game is over. */
  turn(state: State): Seat | null;
  legalMoves(state: State, seat: Seat): Move[];
  /** Plays a move. Throws IllegalMoveError if the move isn't allowed. */
  play(state: State, seat: Seat, move: Move): MoveOutcome<State, Event>;
  /** What one seat may see. Pass null for a spectator. Hides hands, words, and decks. */
  view(state: State, seat: Seat | null): View;
  result(state: State): GameResult | null;
  bot?(state: State, seat: Seat, options: BotOptions): Move;
}

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}

import { checkSeats, nextSeat } from "../engine/seats";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";
import {
  beats,
  combosIn,
  describe,
  shuffledDeck,
  type Card,
  type Combo,
} from "./cards";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const HAND_SIZE = 13;

/** The cards on the table: the play everyone else has to beat or pass on. */
export interface TablePlay {
  cards: Card[];
  combo: Combo;
  seat: Seat;
}

export interface PusoyState {
  hands: Card[][];
  turn: Seat | null;
  table: TablePlay | null;
  /** Passes in a row since the last play. When everyone else passes, the round is won. */
  passes: number;
  /**
   * The card the first play has to include: the lowest card dealt, which is
   * the 3 of clubs with four players. Null once the first play is made.
   */
  opening: Card | null;
  winner: Seat | null;
  turns: number;
}

/** What one seat may see: its own hand, and only how many cards everyone else holds. */
export interface PusoyView extends Omit<PusoyState, "hands"> {
  hand: Card[] | null;
  counts: number[];
}

/** The cards to play, sorted. An empty list means pass. */
export type PusoyMove = Card[];

export type PusoyEvent =
  | { type: "play"; seat: Seat; cards: Card[]; combo: Combo }
  | { type: "pass"; seat: Seat }
  /** Everyone else passed, so this seat starts the next round with anything. */
  | { type: "roundWon"; seat: Seat }
  | { type: "gameOver"; winner: Seat };

/**
 * Deals 13 cards each. With fewer than four players the rest of the deck sits
 * out. Whoever holds the lowest card dealt goes first, and has to play it.
 */
export function setup(options: { seats?: number; rng?: () => number } = {}): PusoyState {
  const { seats = MAX_PLAYERS, rng = Math.random } = options;
  checkSeats("Pusoy Dos", seats, MIN_PLAYERS, MAX_PLAYERS, 0);
  const deck = shuffledDeck(rng);
  const hands = Array.from({ length: seats }, (_, seat) =>
    deck.slice(seat * HAND_SIZE, (seat + 1) * HAND_SIZE).sort((a, b) => a - b),
  );
  const opening = Math.min(...hands.flat());
  const turn = hands.findIndex((hand) => hand.includes(opening));
  return { hands, turn, table: null, passes: 0, opening, winner: null, turns: 0 };
}

export function viewFor(state: PusoyState, seat: Seat | null): PusoyView {
  const { hands, ...rest } = state;
  return { ...rest, hand: seat === null ? null : [...hands[seat]], counts: hands.map((hand) => hand.length) };
}

/**
 * Every legal move from what a seat can see. Works on a view, so the bot gets
 * exactly the same information as a person and can't look at anyone else's cards.
 */
export function movesFor(view: PusoyView, seat: Seat): PusoyMove[] {
  if (view.turn !== seat || !view.hand) return [];
  let plays = combosIn(view.hand);
  const opening = view.opening;
  if (opening !== null) plays = plays.filter((cards) => cards.includes(opening));
  if (view.table) {
    const table = view.table.combo;
    plays = plays.filter((cards) => beats(describe(cards)!, table));
  }
  // The player starting a round has to play something. Everyone else may pass.
  return view.table ? [...plays, []] : plays;
}

export function legalMoves(state: PusoyState, seat: Seat): PusoyMove[] {
  return movesFor(viewFor(state, seat), seat);
}

export function play(state: PusoyState, seat: Seat, move: PusoyMove): MoveOutcome<PusoyState, PusoyEvent> {
  if (state.turn === null) throw new IllegalMoveError("The game is already over");
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Array.isArray(move) || !move.every((card) => Number.isInteger(card))) {
    throw new IllegalMoveError("A move is a list of cards");
  }
  const players = state.hands.length;
  const next = nextSeat(seat, players);
  const events: PusoyEvent[] = [];

  if (move.length === 0) {
    if (!state.table) throw new IllegalMoveError("You're starting this round, so you have to play something");
    events.push({ type: "pass", seat });
    const passes = state.passes + 1;
    if (passes === players - 1) {
      // Everyone else passed, so whoever played last starts a fresh round.
      events.push({ type: "roundWon", seat: state.table.seat });
      return {
        state: { ...state, table: null, passes: 0, turn: state.table.seat, turns: state.turns + 1 },
        events,
      };
    }
    return { state: { ...state, passes, turn: next, turns: state.turns + 1 }, events };
  }

  const hand = state.hands[seat];
  const cards = [...move].sort((a, b) => a - b);
  if (!cards.every((card) => hand.includes(card))) throw new IllegalMoveError("You don't have those cards");
  const combo = describe(cards);
  if (!combo) throw new IllegalMoveError("Those cards don't make a hand you can play");
  if (state.opening !== null && !cards.includes(state.opening)) {
    throw new IllegalMoveError("The first play has to include the lowest card dealt");
  }
  if (state.table && !beats(combo, state.table.combo)) {
    throw new IllegalMoveError("That doesn't beat what's on the table");
  }

  const hands = state.hands.map((h, i) => (i === seat ? h.filter((card) => !cards.includes(card)) : h));
  events.push({ type: "play", seat, cards, combo });
  const done = hands[seat].length === 0;
  if (done) events.push({ type: "gameOver", winner: seat });
  return {
    state: {
      hands,
      turn: done ? null : next,
      table: { cards, combo, seat },
      passes: 0,
      opening: null,
      winner: done ? seat : null,
      turns: state.turns + 1,
    },
    events,
  };
}

/** The first player to run out of cards wins. Everyone's score is the cards they still hold. */
export function result(state: PusoyState | PusoyView): GameResult | null {
  if (state.turn !== null || state.winner === null) return null;
  const scores = "counts" in state ? state.counts : state.hands.map((hand) => hand.length);
  return { winners: [state.winner], scores };
}

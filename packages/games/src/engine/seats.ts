import type { Seat } from "./types";

/** The seat after `seat`, going around a table of `players`. */
export function nextSeat(seat: Seat, players: number): Seat {
  return (seat + 1) % players;
}

/**
 * The seats with the highest score, which share the win. When every seat ties,
 * nobody won: it's a draw, so the list is empty.
 */
export function leaders(scores: readonly number[]): Seat[] {
  const best = Math.max(...scores);
  const top = scores.flatMap((score, seat) => (score === best ? [seat] : []));
  return top.length === scores.length ? [] : top;
}

/** Throws unless `seats` is a whole number of players the game allows, and `first` is one of them. */
export function checkSeats(game: string, seats: number, min: number, max: number, first: Seat) {
  if (!Number.isInteger(seats) || seats < min || seats > max) {
    throw new Error(`${game} is played by ${min} to ${max} players`);
  }
  if (!Number.isInteger(first) || first < 0 || first >= seats) throw new Error(`No seat ${first} in ${game}`);
}

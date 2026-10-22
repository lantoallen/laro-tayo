import type { Seat } from "@laro/games";

/** "Ana", "Ana and Ben", or "Ana, Ben and Cai". */
export function listNames(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * The title once a game ends: "You win", "Red wins", "You tied with Bot 2", or
 * a draw. `you` is the seat of whoever is looking, or null in pass and play.
 */
export function resultTitle(winners: readonly Seat[], names: readonly string[], you: Seat | null): string {
  if (winners.length === 0) return "It's a draw";
  if (winners.length > 1) {
    if (you !== null && winners.includes(you)) {
      return `You tied with ${listNames(winners.filter((seat) => seat !== you).map((seat) => names[seat]))}`;
    }
    return `It's a tie between ${listNames(winners.map((seat) => names[seat]))}`;
  }
  const [winner] = winners;
  if (winner === you) return "You win";
  // With only one other player, losing says it all. With more, say who won.
  if (you !== null && names.length === 2) return "You lose";
  return `${names[winner]} wins`;
}

/** "Points: You 101, Bot 1 86, Bot 2 40", for any number of players. */
export function scoreLine(label: string, names: readonly string[], scores: readonly number[]): string {
  return `${label}: ${names.map((name, seat) => `${name} ${scores[seat]}`).join(", ")}`;
}

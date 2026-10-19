export type GameId = "sungka" | "dama" | "pusoy-dos" | "hulaan-mo";

/** The flag color each game is shown in. */
export type GameColor = "blue" | "red" | "yellow" | "ink";

export interface GameInfo {
  id: GameId;
  name: string;
  players: string;
  description: string;
  color: GameColor;
  /** Where to play it. Games still being built have none. */
  href?: string;
  /** Whether it can be played online once the room server is set up. */
  online?: boolean;
  /** How it can be played, when that isn't the usual bot or pass and play. */
  ways?: string;
}

/** Every game in Laro Tayo!, in the order they're shown. */
export const GAMES: GameInfo[] = [
  {
    id: "sungka",
    name: "Sungka",
    players: "2 players",
    description: "The shell game played on a long wooden board with 16 holes and 98 shells.",
    color: "blue",
    href: "/sungka",
    online: true,
  },
  {
    id: "dama",
    name: "Dama",
    players: "2 players",
    description: "Filipino checkers. Kings fly across the board, and you always have to take the biggest capture.",
    color: "red",
    href: "/dama",
    online: true,
  },
  {
    id: "pusoy-dos",
    name: "Pusoy Dos",
    players: "4 players",
    description: "The card game where you race to be the first to get rid of all 13 cards.",
    color: "yellow",
    href: "/pusoy-dos",
    ways: "Play against three bots.",
  },
  {
    id: "hulaan-mo",
    name: "Hulaan Mo",
    players: "4 or more players",
    description: "The guesser holds the phone to their forehead and asks yes-or-no questions until they get the word.",
    color: "ink",
    href: "/hulaan-mo",
    ways: "Party game for 2 to 4 teams on one phone.",
  },
];

/** Background and text classes for each game color. */
export const COLOR_CLASSES: Record<GameColor, string> = {
  blue: "bg-blue text-blue-ink",
  red: "bg-red text-red-ink",
  yellow: "bg-yellow text-yellow-ink",
  ink: "bg-ink text-bg",
};

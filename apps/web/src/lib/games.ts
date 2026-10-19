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
    description: "A card game where you race to get rid of your cards. Bots take any empty seats.",
    color: "yellow",
  },
  {
    id: "hulaan-mo",
    name: "Hulaan Mo",
    players: "2 to 8 players",
    description: "One player sees the word. Everyone else asks yes-or-no questions to guess it.",
    color: "ink",
  },
];

/** Background and text classes for each game color. */
export const COLOR_CLASSES: Record<GameColor, string> = {
  blue: "bg-blue text-blue-ink",
  red: "bg-red text-red-ink",
  yellow: "bg-yellow text-yellow-ink",
  ink: "bg-ink text-bg",
};

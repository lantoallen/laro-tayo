export type GameId = "sungka" | "pusoy-dos" | "hulaan-mo";

export interface GameInfo {
  id: GameId;
  name: string;
  players: string;
  description: string;
  /** Where to play it. Games still being built have none. */
  href?: string;
}

/** Every game in Laro Tayo!, in the order they're shown. */
export const GAMES: GameInfo[] = [
  {
    id: "sungka",
    name: "Sungka",
    players: "2 players",
    description: "The shell game played on a long wooden board with 16 holes and 98 shells.",
    href: "/sungka",
  },
  {
    id: "pusoy-dos",
    name: "Pusoy Dos",
    players: "4 players",
    description: "A card game where you race to get rid of your cards. Bots take any empty seats.",
  },
  {
    id: "hulaan-mo",
    name: "Hulaan Mo",
    players: "2 to 8 players",
    description: "One player sees the word. Everyone else asks yes-or-no questions to guess it.",
  },
];

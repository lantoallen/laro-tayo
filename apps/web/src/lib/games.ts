export type GameId = "sungka" | "dama" | "pusoy-dos" | "hulaan-mo" | "four-in-a-row" | "reversi" | "dots-and-boxes";

/** Games are shown in two groups: ones from the Philippines, and classics played everywhere. */
export type GameGroup = "filipino" | "classic";

/** The flag color each game is shown in. */
export type GameColor = "blue" | "red" | "yellow" | "ink";

export interface GameInfo {
  id: GameId;
  name: string;
  players: string;
  description: string;
  group: GameGroup;
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
    group: "filipino",
    color: "blue",
    href: "/sungka",
    online: true,
  },
  {
    id: "dama",
    name: "Dama",
    players: "2 players",
    description: "Filipino checkers. Kings fly across the board, and you always have to take the biggest capture.",
    group: "filipino",
    color: "red",
    href: "/dama",
    online: true,
  },
  {
    id: "pusoy-dos",
    name: "Pusoy Dos",
    players: "4 players",
    description: "The card game where you race to be the first to get rid of all 13 cards.",
    group: "filipino",
    color: "yellow",
    href: "/pusoy-dos",
    ways: "Play against three bots.",
  },
  {
    id: "hulaan-mo",
    name: "Hulaan Mo",
    players: "4 or more players",
    description: "The guesser holds the phone to their forehead and asks yes-or-no questions until they get the word.",
    group: "filipino",
    color: "ink",
    href: "/hulaan-mo",
    ways: "Party game for 2 to 4 teams on one phone.",
  },
  {
    id: "four-in-a-row",
    name: "Four in a Row",
    players: "2 players",
    description: "Drop discs into the grid and get four in a line before the other player does.",
    group: "classic",
    color: "yellow",
    href: "/four-in-a-row",
    online: true,
  },
  {
    id: "reversi",
    name: "Reversi",
    players: "2 players",
    description: "Trap the other player's discs between yours to flip them. Most discs at the end wins.",
    group: "classic",
    color: "ink",
    href: "/reversi",
    online: true,
  },
  {
    id: "dots-and-boxes",
    name: "Dots and Boxes",
    players: "2 players",
    description: "Take turns drawing lines between dots. Close a box to claim it and go again.",
    group: "classic",
    color: "blue",
    href: "/dots-and-boxes",
    online: true,
  },
];

export const GROUP_TITLES: Record<GameGroup, string> = {
  filipino: "Filipino games",
  classic: "Classics",
};

/** Background and text classes for each game color. */
export const COLOR_CLASSES: Record<GameColor, string> = {
  blue: "bg-blue text-blue-ink",
  red: "bg-red text-red-ink",
  yellow: "bg-yellow text-yellow-ink",
  ink: "bg-ink text-bg",
};

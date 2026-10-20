export type GameId = "sungka" | "dama" | "pusoy-dos" | "hulaan-mo" | "four-in-a-row" | "reversi" | "dots-and-boxes";

/** Games are shown in two groups: ones from the Philippines, and classics played everywhere. */
export type GameGroup = "filipino" | "classic";

/** The flag color each game is shown in. */
export type GameColor = "blue" | "red" | "yellow" | "ink";

/** How a game can be played. Online only shows when a room server is set up. */
export type PlayMode = "bot" | "local" | "online" | "teams";

export interface GameInfo {
  id: GameId;
  name: string;
  players: string;
  /** One short line for the game's tile. */
  tagline: string;
  group: GameGroup;
  color: GameColor;
  /** Where to play it. Games still being built have none. */
  href?: string;
  modes: PlayMode[];
}

/** Every game in Laro Tayo!, in the order they're shown. */
export const GAMES: GameInfo[] = [
  {
    id: "sungka",
    name: "Sungka",
    players: "2 players",
    tagline: "Sow shells around the board and fill your store.",
    group: "filipino",
    color: "blue",
    href: "/sungka",
    modes: ["bot", "local", "online"],
  },
  {
    id: "dama",
    name: "Dama",
    players: "2 players",
    tagline: "Filipino checkers, with kings that fly.",
    group: "filipino",
    color: "red",
    href: "/dama",
    modes: ["bot", "local", "online"],
  },
  {
    id: "pusoy-dos",
    name: "Pusoy Dos",
    players: "4 players",
    tagline: "Be the first to play all 13 of your cards.",
    group: "filipino",
    color: "yellow",
    href: "/pusoy-dos",
    modes: ["bot"],
  },
  {
    id: "hulaan-mo",
    name: "Hulaan Mo",
    players: "4 or more",
    tagline: "Guess the word on your forehead with yes-or-no questions.",
    group: "filipino",
    color: "ink",
    href: "/hulaan-mo",
    modes: ["teams"],
  },
  {
    id: "four-in-a-row",
    name: "Four in a Row",
    players: "2 players",
    tagline: "Drop discs and line up four before they do.",
    group: "classic",
    color: "yellow",
    href: "/four-in-a-row",
    modes: ["bot", "local", "online"],
  },
  {
    id: "reversi",
    name: "Reversi",
    players: "2 players",
    tagline: "Trap discs to flip them to your color.",
    group: "classic",
    color: "ink",
    href: "/reversi",
    modes: ["bot", "local", "online"],
  },
  {
    id: "dots-and-boxes",
    name: "Dots and Boxes",
    players: "2 players",
    tagline: "Close a box to claim it and go again.",
    group: "classic",
    color: "blue",
    href: "/dots-and-boxes",
    modes: ["bot", "local", "online"],
  },
];

export const MODE_LABELS: Record<PlayMode, string> = {
  bot: "Bot",
  local: "Same phone",
  online: "Online",
  teams: "Teams",
};

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

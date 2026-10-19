import { packWords, type PackId } from "./words";

export interface HulaanSettings {
  /** How many teams take turns, from 2 to 4. */
  teams: number;
  /** Seconds in each turn. */
  seconds: number;
  /** How many turns each team gets. */
  rounds: number;
  pack: PackId | "mixed";
}

export type Phase =
  /** Waiting for the team to hand the phone to their guesser. */
  | "ready"
  | "playing"
  /** Time's up: showing which words the team got. */
  | "summary"
  | "over";

export interface WordResult {
  word: string;
  got: boolean;
}

export interface HulaanState {
  settings: HulaanSettings;
  /** Words in the order they'll come up. */
  deck: string[];
  /** The next card to draw from the deck. */
  next: number;
  phase: Phase;
  team: number;
  /** Which turn each team is on, starting at 0. */
  round: number;
  /** The word the guesser is on right now. */
  word: string | null;
  /** The words in the turn being played or just finished. */
  turnWords: WordResult[];
  scores: number[];
}

export type HulaanAction = { type: "start" } | { type: "got" } | { type: "skip" } | { type: "timeUp" } | { type: "next" };

export class HulaanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HulaanError";
  }
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGame(settings: HulaanSettings, rng: () => number = Math.random): HulaanState {
  if (!Number.isInteger(settings.teams) || settings.teams < 2 || settings.teams > 4) {
    throw new HulaanError("Hulaan Mo needs 2 to 4 teams");
  }
  return {
    settings,
    deck: shuffle(packWords(settings.pack), rng),
    next: 0,
    phase: "ready",
    team: 0,
    round: 0,
    word: null,
    turnWords: [],
    scores: Array.from({ length: settings.teams }, () => 0),
  };
}

/** Takes the next word. A long game goes back to the start of the deck rather than running out. */
function draw(state: HulaanState): Pick<HulaanState, "word" | "next"> {
  return { word: state.deck[state.next % state.deck.length], next: state.next + 1 };
}

function requirePhase(state: HulaanState, phase: Phase, action: HulaanAction["type"]): void {
  if (state.phase !== phase) throw new HulaanError(`Can't ${action} while the game is ${state.phase}`);
}

export function reduce(state: HulaanState, action: HulaanAction): HulaanState {
  switch (action.type) {
    case "start":
      requirePhase(state, "ready", action.type);
      return { ...state, phase: "playing", turnWords: [], ...draw(state) };

    case "got":
    case "skip": {
      requirePhase(state, "playing", action.type);
      const got = action.type === "got";
      const scores = state.scores.map((score, team) => (got && team === state.team ? score + 1 : score));
      return { ...state, scores, turnWords: [...state.turnWords, { word: state.word!, got }], ...draw(state) };
    }

    case "timeUp":
      requirePhase(state, "playing", action.type);
      // The word on screen when time ran out counts as missed.
      return { ...state, phase: "summary", word: null, turnWords: [...state.turnWords, { word: state.word!, got: false }] };

    case "next": {
      requirePhase(state, "summary", action.type);
      const lastTeam = state.team === state.settings.teams - 1;
      if (lastTeam && state.round === state.settings.rounds - 1) return { ...state, phase: "over" };
      return {
        ...state,
        phase: "ready",
        team: lastTeam ? 0 : state.team + 1,
        round: lastTeam ? state.round + 1 : state.round,
        turnWords: [],
      };
    }
  }
}

/** The teams with the highest score once the game is over. More than one means a tie. */
export function leaders(state: HulaanState): number[] {
  const best = Math.max(...state.scores);
  return state.scores.flatMap((score, team) => (score === best ? [team] : []));
}

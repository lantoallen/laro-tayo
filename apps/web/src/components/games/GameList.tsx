import Link from "next/link";
import { COLOR_CLASSES, GAMES, GROUP_TITLES, MODE_LABELS, type GameGroup, type GameInfo } from "@/lib/games";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { GameArt } from "./GameArt";

const READY = GAMES.filter((game) => game.href);
const UPCOMING = GAMES.filter((game) => !game.href);
const GROUPS = Object.keys(GROUP_TITLES) as GameGroup[];
/** Tiles rise a little under the pointer or keyboard focus. */
const LIFT = "transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5";

export function GameList() {
  return (
    <>
      {GROUPS.map((group) => (
        <section key={group} aria-labelledby={`${group}-heading`} className="mt-8">
          <h2 id={`${group}-heading`} className="text-xl">
            {GROUP_TITLES[group]}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {READY.filter((game) => game.group === group).map((game) => (
              <li key={game.id} className="flex">
                <GameTile game={game} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {UPCOMING.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mt-10">
          <h2 id="upcoming-heading" className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
            In the works
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {UPCOMING.map((game) => (
              <li key={game.id} className="py-4">
                <h3 className="font-bold">
                  {game.name} <span className="font-normal text-muted">· {game.players}</span>
                </h3>
                <p className="mt-0.5 text-muted">{game.tagline}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** A game's drawing, name, and how it can be played. The whole tile is the link. */
function GameTile({ game }: { game: GameInfo }) {
  const modes = game.modes.filter((mode) => mode !== "online" || ONLINE_ENABLED);
  return (
    <Link href={game.href!} className={`card flex w-full flex-col overflow-hidden ${LIFT}`}>
      <div
        className={`aspect-[4/3] overflow-hidden border-b-[3px] border-outline p-3 ${COLOR_CLASSES[game.color]}`}
      >
        <GameArt id={game.id} className="size-full" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-lg leading-tight">{game.name}</h3>
        <p className="mt-0.5 text-xs font-semibold text-muted">{game.players}</p>
        <p className="mt-2 flex-1 text-sm text-muted">{game.tagline}</p>
        <ul aria-label="Ways to play" className="mt-3 flex flex-wrap gap-1">
          {modes.map((mode) => (
            <li key={mode} className="rounded-md border border-line px-1.5 py-0.5 text-xs font-medium">
              {MODE_LABELS[mode]}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { COLOR_CLASSES, GAMES } from "@/lib/games";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { GameArt } from "./GameArt";

const READY = GAMES.filter((game) => game.href);
const UPCOMING = GAMES.filter((game) => !game.href);

export function GameList() {
  return (
    <>
      <ul className="mt-6 grid gap-6">
        {READY.map((game) => (
          <li key={game.id}>
            <Link href={game.href!} className="card group grid overflow-hidden sm:grid-cols-[2fr_3fr]">
              <div
                className={`grid place-items-center border-b-[3px] border-outline p-6 sm:border-r-[3px] sm:border-b-0 ${COLOR_CLASSES[game.color]}`}
              >
                <GameArt id={game.id} className="max-h-32 w-full max-w-72" />
              </div>
              <div className="p-5">
                <h2 className="text-2xl">
                  {game.name} <span className="text-base text-muted">· {game.players}</span>
                </h2>
                <p className="mt-2 text-muted">{game.description}</p>
                <p className="mt-2 text-sm text-muted">
                  {game.ways ??
                    (game.online && ONLINE_ENABLED
                      ? "Play a bot, pass one phone around, or play a friend online."
                      : "Play a bot or pass one phone around.")}
                </p>
                <span className="btn btn-primary mt-5">Play {game.name}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

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
                <p className="mt-0.5 text-muted">{game.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

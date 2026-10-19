import Link from "next/link";
import { GAMES } from "@/lib/games";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { SungkaArt } from "./SungkaArt";

const UPCOMING = GAMES.filter((game) => !game.href);

export function GameList() {
  return (
    <>
      <section aria-labelledby="sungka-heading" className="mt-6">
        <Link
          href="/sungka"
          className="group grid overflow-hidden rounded-xl border border-line bg-surface hover:border-blue sm:grid-cols-[2fr_3fr]"
        >
          <div className="grid place-items-center bg-bg p-6">
            <SungkaArt className="w-full max-w-72" />
          </div>
          <div className="p-5">
            <h2 id="sungka-heading" className="text-2xl font-bold">
              Sungka <span className="text-base font-normal text-muted">· 2 players</span>
            </h2>
            <p className="mt-2 text-muted">
              The shell game played on a long wooden board with 16 holes and 98 shells.
            </p>
            <p className="mt-2 text-sm text-muted">
              {ONLINE_ENABLED
                ? "Play a bot, pass one phone around, or play a friend online."
                : "Play a bot or pass one phone around."}
            </p>
            <span className="mt-5 inline-block rounded-lg bg-blue px-5 py-2.5 font-semibold text-blue-ink group-hover:opacity-90">
              Play Sungka
            </span>
          </div>
        </Link>
      </section>

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
    </>
  );
}

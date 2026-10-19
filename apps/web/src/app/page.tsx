import Link from "next/link";
import { GameArt } from "@/components/games/GameArt";
import { SunMark } from "@/components/SunMark";
import { GAMES } from "@/lib/games";

/** The start screen people see first. "Get started" takes them into the app. */
export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <SunMark className="size-20" />
      <h1 className="mt-6 text-5xl font-bold tracking-tight">Laro Tayo!</h1>
      <p className="mt-3 text-lg text-muted">Filipino games you can play on your phone.</p>

      <ul aria-label="Games" className="mt-10 grid w-full grid-cols-3 gap-3">
        {GAMES.map((game) => (
          <li key={game.id} className="flex flex-col items-center gap-2">
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-line bg-surface px-2">
              <GameArt id={game.id} className="max-h-[75%] w-full" />
            </div>
            <span className="text-sm font-semibold">{game.name}</span>
          </li>
        ))}
      </ul>

      <Link href="/games" className="mt-10 w-full rounded-xl bg-blue py-4 text-lg font-semibold text-blue-ink">
        Get started
      </Link>
      <p className="mt-4 text-sm text-muted">Free, no ads, and nothing to download.</p>
    </main>
  );
}

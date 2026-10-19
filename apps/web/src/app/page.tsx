import Link from "next/link";
import { GameArt } from "@/components/games/GameArt";
import { Logo } from "@/components/Logo";
import { GAMES, type GameId } from "@/lib/games";

/** Each game gets one of the flag colors for its name band. */
const BANDS: Record<GameId, string> = {
  sungka: "bg-blue text-blue-ink",
  "pusoy-dos": "bg-red text-red-ink",
  "hulaan-mo": "bg-yellow text-yellow-ink",
};

/** The start screen people see first. "Get started" takes them into the app. */
export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <Logo large className="text-5xl" />
      <p className="mt-8 text-lg font-medium text-muted">Filipino games you can play on your phone.</p>

      <ul aria-label="Games" className="mt-8 grid w-full grid-cols-3 gap-3">
        {GAMES.map((game) => (
          <li key={game.id} className="overflow-hidden rounded-xl border-[3px] border-outline bg-surface shadow-[3px_3px_0_var(--outline)]">
            <div className="grid aspect-[4/3] place-items-center px-2">
              <GameArt id={game.id} className="max-h-[75%] w-full" />
            </div>
            <p className={`border-t-[3px] border-outline py-1 font-display text-[0.7rem] ${BANDS[game.id]}`}>
              {game.name}
            </p>
          </li>
        ))}
      </ul>

      <Link href="/games" className="btn btn-primary mt-10 w-full py-4 text-lg">
        Get started
      </Link>
      <p className="mt-4 text-sm text-muted">Free, no ads, and nothing to download.</p>
    </main>
  );
}

import Link from "next/link";
import { GameArt } from "@/components/games/GameArt";
import { InstallButton } from "@/components/InstallButton";
import { Logo } from "@/components/Logo";
import { COLOR_CLASSES, GAMES } from "@/lib/games";

const TILE = "overflow-hidden rounded-xl border-[3px] border-outline bg-surface shadow-[3px_3px_0_var(--outline)]";

/** The start screen people see first. "Get started" takes them into the app. */
export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <Logo large className="text-5xl" />
      <p className="mt-8 text-lg font-medium text-muted">Filipino games and classics you can play on your phone.</p>

      <ul aria-label="Games" className="mt-8 flex w-full flex-wrap justify-center gap-2">
        {GAMES.map((game) => (
          <li key={game.id} className={`w-[calc(25%-0.375rem)] ${TILE}`}>
            <div className="grid aspect-[4/3] place-items-center px-2">
              <GameArt id={game.id} className="max-h-[75%] w-full" />
            </div>
            <p className={`border-t-[3px] border-outline py-1 font-display text-[0.6rem] ${COLOR_CLASSES[game.color]}`}>
              {game.name}
            </p>
          </li>
        ))}
      </ul>

      <Link href="/games" className="btn btn-primary mt-10 w-full py-4 text-lg">
        Get started
      </Link>
      <p className="mt-4 text-sm text-muted">Free, no ads, and nothing to download.</p>
      <InstallButton className="mt-4 w-full" />
    </main>
  );
}

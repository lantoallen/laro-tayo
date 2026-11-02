import Link from "next/link";
import { GameArt } from "@/components/games/GameArt";
import { InstallButton } from "@/components/InstallButton";
import { Logo } from "@/components/Logo";
import { COLOR_CLASSES, GAMES } from "@/lib/games";

const TILE = "overflow-hidden rounded-xl border-[3px] border-outline bg-surface shadow-[3px_3px_0_var(--outline)]";

/** The start screen people see first. "Get started" takes them into the app. */
export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <Logo large className="text-5xl" />
      <p className="mt-6 text-lg font-medium text-muted">Filipino games and classics you can play on your phone.</p>

      <ul aria-label="Games" className="mt-6 flex w-full flex-wrap justify-center gap-2">
        {GAMES.map((game) => (
          // Four a row, or three on the narrowest phones, so every name fits in two lines.
          <li key={game.id} className={`flex w-[calc(25%-0.375rem)] flex-col max-[359px]:w-[calc(33.333%-0.334rem)] ${TILE}`}>
            <div className="grid aspect-[4/3] place-items-center px-2">
              <GameArt id={game.id} className="max-h-[75%] w-full" />
            </div>
            {/* Room for two lines in every tile, so the rows line up whether a name wraps or not. */}
            <p
              className={`mt-auto grid min-h-[2.6rem] place-items-center border-t-[3px] border-outline px-0.5 py-1 text-xs leading-tight font-bold tracking-tight ${COLOR_CLASSES[game.color]}`}
            >
              {game.name}
            </p>
          </li>
        ))}
      </ul>

      <Link href="/games" className="btn btn-primary mt-6 w-full py-4 text-lg">
        Get started
      </Link>
      <p className="mt-4 text-sm text-muted">Free, no ads, and nothing to download.</p>
      <InstallButton className="mt-4 w-full" />
    </main>
  );
}

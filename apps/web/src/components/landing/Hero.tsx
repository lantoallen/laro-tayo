import Link from "next/link";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { GameTiles } from "./GameTiles";

export function Hero() {
  return (
    <section className="pt-4 pb-10 sm:pt-10">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Filipino games you can play on your phone.
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        A growing collection of Filipino games.{" "}
        {ONLINE_ENABLED
          ? "Play against a bot, pass one phone around, or send friends a link and play on your own phones."
          : "Play against a bot, or pass one phone around with friends."}{" "}
        It&apos;s free and runs in your browser.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/games" className="rounded-lg bg-blue px-6 py-3 font-semibold text-blue-ink">
          Play now
        </Link>
        <Link href="#ways" className="rounded-lg border border-line px-5 py-3 font-semibold">
          How it works
        </Link>
      </div>
      <GameTiles />
    </section>
  );
}

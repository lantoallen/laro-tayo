import Link from "next/link";
import { SungkaDemo } from "@/components/sungka/SungkaDemo";

export function Hero() {
  return (
    <section className="pt-4 pb-12 sm:pt-10">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Sungka, no board needed.
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Play the Filipino shell game on your phone, against a bot or with a friend on the same phone. It&apos;s free,
        has no ads, and runs in your browser.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/sungka" className="rounded-lg bg-blue px-5 py-3 font-semibold text-blue-ink">
          Play Sungka
        </Link>
        <Link href="/sungka#how-to" className="rounded-lg border border-line px-5 py-3 font-semibold">
          How to play
        </Link>
      </div>
      <figure className="mt-10">
        <SungkaDemo />
        <figcaption className="mt-3 text-center text-sm text-muted">
          Two bots playing a live game.
        </figcaption>
      </figure>
    </section>
  );
}

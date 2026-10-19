import Link from "next/link";
import { SungkaDemo } from "@/components/sungka/SungkaDemo";
import { ONLINE_ENABLED } from "@/lib/rooms";

export function Hero() {
  return (
    <section className="pt-4 pb-12 sm:pt-10">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Filipino games you can play on your phone.
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Sungka is ready now.{" "}
        {ONLINE_ENABLED
          ? "Play a bot, pass one phone back and forth, or send a friend a link and play on two phones."
          : "Play a bot, or pass one phone back and forth with a friend."}{" "}
        It&apos;s free and runs in your browser.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/games" className="rounded-lg bg-blue px-6 py-3 font-semibold text-blue-ink">
          Play now
        </Link>
        <Link href="/sungka#how-to" className="rounded-lg border border-line px-5 py-3 font-semibold">
          How Sungka works
        </Link>
      </div>
      <figure className="mt-10">
        <SungkaDemo />
        <figcaption className="mt-3 text-center text-sm text-muted">
          Two bots playing a live game of Sungka.
        </figcaption>
      </figure>
    </section>
  );
}

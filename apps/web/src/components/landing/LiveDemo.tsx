import Link from "next/link";
import { SungkaDemo } from "@/components/sungka/SungkaDemo";

export function LiveDemo() {
  return (
    <section aria-labelledby="demo-heading" className="py-10">
      <h2 id="demo-heading" className="text-2xl font-bold">
        Watch a game
      </h2>
      <p className="mt-1 max-w-xl text-muted">
        Sungka is the first game you can play. These two bots are playing it live, right on this page.
      </p>
      <div className="mt-6">
        <SungkaDemo />
      </div>
      <p className="mt-4 text-center">
        <Link href="/sungka" className="font-semibold text-blue underline underline-offset-4">
          Play Sungka yourself
        </Link>
      </p>
    </section>
  );
}

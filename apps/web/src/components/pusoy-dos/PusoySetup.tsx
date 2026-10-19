"use client";

import Link from "next/link";
import type { BotLevel } from "@laro/games";
import { Segmented } from "@/components/game/Segmented";
import { LEVEL_LABELS } from "@/components/game/settings";
import { Rules } from "./Rules";

export function PusoySetup({
  level,
  onLevel,
  onStart,
}: {
  level: BotLevel;
  onLevel: (level: BotLevel) => void;
  onStart: () => void;
}) {
  const levels = Object.keys(LEVEL_LABELS) as BotLevel[];
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/games" className="text-sm text-muted hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-2 text-3xl">Pusoy Dos</h1>
      <p className="mt-1 text-muted">The Filipino card game. Be the first to get rid of all 13 cards.</p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onStart();
        }}
      >
        <p className="text-sm text-muted">You play against three bots.</p>
        <Segmented<BotLevel>
          legend="Bot level"
          name="level"
          value={level}
          onChange={onLevel}
          options={levels.map((value) => ({ value, label: LEVEL_LABELS[value] }))}
        />
        <button type="submit" className="btn btn-primary w-full py-3.5">
          Deal the cards
        </button>
      </form>

      <section aria-labelledby="how-to" className="mt-10 border-t border-line pt-6">
        <h2 id="how-to" className="mb-3 text-lg">
          How to play
        </h2>
        <Rules />
      </section>
    </main>
  );
}

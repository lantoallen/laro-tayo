"use client";

import Link from "next/link";
import type { HulaanSettings, PackId } from "@laro/games/hulaan-mo";
import { Segmented } from "@/components/game/Segmented";
import { Rules } from "./Rules";

type Pack = PackId | "mixed";

export function HulaanSetup({
  settings,
  onChange,
  onStart,
}: {
  settings: HulaanSettings;
  onChange: (settings: HulaanSettings) => void;
  onStart: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/games" className="text-sm text-muted hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-2 text-3xl">Hulaan Mo</h1>
      <p className="mt-1 text-muted">
        A guessing game for a group, on one phone. The guesser can&apos;t see the word and asks yes-or-no questions.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onStart();
        }}
      >
        <Segmented<string>
          legend="Teams"
          name="teams"
          value={String(settings.teams)}
          onChange={(teams) => onChange({ ...settings, teams: Number(teams) })}
          options={["2", "3", "4"].map((value) => ({ value, label: value }))}
        />
        <Segmented<string>
          legend="Time per turn"
          name="seconds"
          value={String(settings.seconds)}
          onChange={(seconds) => onChange({ ...settings, seconds: Number(seconds) })}
          options={["60", "90", "120"].map((value) => ({ value, label: `${value}s` }))}
        />
        <Segmented<string>
          legend="Turns per team"
          name="rounds"
          value={String(settings.rounds)}
          onChange={(rounds) => onChange({ ...settings, rounds: Number(rounds) })}
          options={["1", "2", "3"].map((value) => ({ value, label: value }))}
        />
        <Segmented<Pack>
          legend="Words"
          name="pack"
          value={settings.pack}
          onChange={(pack) => onChange({ ...settings, pack })}
          options={[
            { value: "mixed", label: "Mixed" },
            { value: "food", label: "Food" },
            { value: "places", label: "Places" },
            { value: "things", label: "Things" },
          ]}
        />
        <button type="submit" className="btn btn-primary w-full py-3.5">
          Start the game
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

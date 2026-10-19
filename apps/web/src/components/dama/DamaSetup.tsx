"use client";

import Link from "next/link";
import type { BotLevel } from "@laro/games";
import { Segmented } from "@/components/game/Segmented";
import { LEVEL_LABELS, type FirstPlayer } from "@/components/game/settings";
import { Rules } from "./Rules";
import type { DamaMode, DamaSettings } from "./settings";

export function DamaSetup({
  settings,
  onChange,
  onStart,
}: {
  settings: DamaSettings;
  onChange: (settings: DamaSettings) => void;
  onStart: () => void;
}) {
  const vsBot = settings.mode === "bot";
  const levels = Object.keys(LEVEL_LABELS) as BotLevel[];

  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/games" className="text-sm text-muted hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-2 text-3xl">Dama</h1>
      <p className="mt-1 text-muted">Filipino checkers, with kings that fly across the board.</p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onStart();
        }}
      >
        <Segmented<DamaMode>
          legend="Opponent"
          name="mode"
          value={settings.mode}
          onChange={(mode) => onChange({ ...settings, mode })}
          options={[
            { value: "bot", label: "Bot" },
            { value: "local", label: "Pass and play" },
          ]}
        />
        {!vsBot && <p className="-mt-3 text-sm text-muted">Take turns on one phone. Red is at the bottom.</p>}

        {vsBot && (
          <Segmented<BotLevel>
            legend="Bot level"
            name="level"
            value={settings.level}
            onChange={(level) => onChange({ ...settings, level })}
            options={levels.map((level) => ({ value: level, label: LEVEL_LABELS[level] }))}
          />
        )}

        <Segmented<FirstPlayer>
          legend="Who goes first"
          name="first"
          value={settings.first}
          onChange={(first) => onChange({ ...settings, first })}
          options={[
            { value: "me", label: vsBot ? "You" : "Red" },
            { value: "them", label: vsBot ? "Bot" : "Blue" },
            { value: "random", label: "Random" },
          ]}
        />

        <button type="submit" className="btn btn-primary w-full py-3.5">
          Start
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

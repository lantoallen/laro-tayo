"use client";

import Link from "next/link";
import type { BotLevel } from "@laro/games";
import { Rules } from "./Rules";
import { LEVEL_LABELS, type FirstPlayer, type SungkaMode, type SungkaSettings } from "./settings";

/** A row of radio buttons that looks like a segmented control. */
function Segmented<T extends string>(props: {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{props.legend}</legend>
      <div className="flex rounded-lg border border-line bg-surface p-1">
        {props.options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer rounded-md px-2 py-2 text-center text-sm font-medium text-muted has-checked:bg-ink has-checked:text-bg has-focus-visible:outline-3 has-focus-visible:outline-blue"
          >
            <input
              type="radio"
              name={props.name}
              value={option.value}
              checked={props.value === option.value}
              onChange={() => props.onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SungkaSetup({
  settings,
  onChange,
  onStart,
}: {
  settings: SungkaSettings;
  onChange: (settings: SungkaSettings) => void;
  onStart: () => void;
}) {
  const vsBot = settings.mode === "bot";
  const levels = Object.keys(LEVEL_LABELS) as BotLevel[];

  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Sungka</h1>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onStart();
        }}
      >
        <Segmented<SungkaMode>
          legend="Opponent"
          name="mode"
          value={settings.mode}
          onChange={(mode) => onChange({ ...settings, mode })}
          options={[
            { value: "bot", label: "Bot" },
            { value: "local", label: "Pass and play" },
          ]}
        />
        {!vsBot && (
          <p className="-mt-3 text-sm text-muted">Take turns on one phone. Player 1 is at the bottom.</p>
        )}

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
            { value: "me", label: vsBot ? "You" : "Player 1" },
            { value: "them", label: vsBot ? "Bot" : "Player 2" },
            { value: "random", label: "Random" },
          ]}
        />

        <button type="submit" className="w-full rounded-lg bg-blue py-3 font-semibold text-blue-ink">
          Start
        </button>
      </form>

      <section aria-labelledby="how-to" className="mt-10 border-t border-line pt-6">
        <h2 id="how-to" className="mb-3 text-lg font-bold">
          How to play
        </h2>
        <Rules />
      </section>
    </main>
  );
}

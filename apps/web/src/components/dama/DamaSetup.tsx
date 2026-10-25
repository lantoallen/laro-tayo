"use client";

import Link from "next/link";
import { useState } from "react";
import type { BotLevel } from "@laro/games";
import { RecordLine } from "@/components/game/RecordLine";
import { Segmented } from "@/components/game/Segmented";
import { LEVEL_LABELS, type FirstPlayer } from "@/components/game/settings";
import { NameField } from "@/components/room/NameField";
import { usePlayer } from "@/lib/player";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { useIsOnline } from "@/lib/useIsOnline";
import { Rules } from "./Rules";
import type { DamaMode, DamaSettings } from "./settings";

export function DamaSetup({
  settings,
  onChange,
  onStart,
  onStartOnline,
}: {
  settings: DamaSettings;
  onChange: (settings: DamaSettings) => void;
  onStart: () => void;
  /** Makes a room and goes to it. Rejects with a message to show if that fails. */
  onStartOnline: (name: string) => Promise<void>;
}) {
  const vsBot = settings.mode === "bot";
  const online = settings.mode === "online";
  const saved = usePlayer();
  // Null until the player types, so a saved name can fill the box once it loads.
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? saved?.name ?? "";
  const [creating, setCreating] = useState(false);
  const connected = useIsOnline();
  const [error, setError] = useState<string | null>(null);
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
          if (!online) return onStart();
          setCreating(true);
          setError(null);
          onStartOnline(name).catch((reason: unknown) => {
            setCreating(false);
            setError(reason instanceof Error ? reason.message : "Couldn't make a room. Try again.");
          });
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
            ...(ONLINE_ENABLED ? [{ value: "online" as const, label: "Online" }] : []),
          ]}
        />
        {settings.mode === "local" && (
          <p className="-mt-3 text-sm text-muted">Take turns on one phone. Red is at the bottom.</p>
        )}
        {online && (
          <>
            <p className="-mt-3 text-sm text-muted">You&apos;ll get a link to send to a friend.</p>
            <NameField value={name} onChange={setTypedName} />
          </>
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

        {!online && (
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
        )}

        <button type="submit" disabled={creating || (online && !connected)} className="btn btn-primary w-full py-3.5">
          {!online ? "Start" : creating ? "Making a room..." : "Make a room"}
        </button>
        {error && (
          <p role="alert" className="-mt-2 text-sm text-red">
            {error}
          </p>
        )}
        {online && !connected && (
          <p className="-mt-2 text-sm text-muted">You&apos;re offline. Playing online needs a connection.</p>
        )}
      </form>

      <RecordLine gameId="dama" />

      <section aria-labelledby="how-to" className="mt-10 border-t border-line pt-6">
        <h2 id="how-to" className="mb-3 text-lg">
          How to play
        </h2>
        <Rules />
      </section>
    </main>
  );
}

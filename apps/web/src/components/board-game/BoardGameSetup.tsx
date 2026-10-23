"use client";

import Link from "next/link";
import { useState } from "react";
import type { BotLevel } from "@laro/games";
import { RecordLine } from "@/components/game/RecordLine";
import { Segmented } from "@/components/game/Segmented";
import {
  LEVEL_LABELS,
  botName,
  type BoardGameSettings,
  type FirstPlayer,
  type PlayMode,
} from "@/components/game/settings";
import { NameField } from "@/components/room/NameField";
import { usePlayer } from "@/lib/player";
import { ONLINE_ENABLED } from "@/lib/rooms";
import type { BoardGameConfig } from "./types";

export function BoardGameSetup<State, Move>({
  config,
  settings,
  onChange,
  onStart,
  onStartOnline,
}: {
  config: BoardGameConfig<State, Move>;
  settings: BoardGameSettings;
  onChange: (settings: BoardGameSettings) => void;
  onStart: () => void;
  /** Makes a room and goes to it. Rejects with a message to show if that fails. */
  onStartOnline: (name: string) => Promise<void>;
}) {
  const { Rules } = config;
  const vsBot = settings.mode === "bot";
  const online = settings.mode === "online";
  const saved = usePlayer();
  // Null until the player types, so a saved name can fill the box once it loads.
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? saved?.name ?? "";
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const levels = Object.keys(LEVEL_LABELS) as BotLevel[];
  const { minSeats, maxSeats } = config.game;
  const counts = Array.from({ length: maxSeats - minSeats + 1 }, (_, i) => String(minSeats + i));
  const players = Math.min(maxSeats, Math.max(minSeats, settings.players));
  const others = players - 1;

  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/games" className="text-sm text-muted hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-2 text-3xl">{config.game.name}</h1>
      <p className="mt-1 text-muted">{config.tagline}</p>

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
        <Segmented<PlayMode>
          legend="Opponent"
          name="mode"
          value={settings.mode}
          onChange={(mode) => onChange({ ...settings, mode })}
          options={[
            { value: "bot", label: "Bot" },
            ...(config.passAndPlay === false ? [] : [{ value: "local" as const, label: "Pass and play" }]),
            ...(config.roomId && ONLINE_ENABLED ? [{ value: "online" as const, label: "Online" }] : []),
          ]}
        />
        {settings.mode === "local" && <p className="-mt-3 text-sm text-muted">Take turns on one phone.</p>}
        {online && (
          <p className="-mt-3 text-sm text-muted">
            You&apos;ll get a link to send to {others === 1 ? "a friend" : "your friends"}.
          </p>
        )}

        {counts.length > 1 && (
          <div>
            <Segmented<string>
              legend="Players"
              name="players"
              value={String(players)}
              onChange={(count) => onChange({ ...settings, players: Number(count) })}
              options={counts.map((count) => ({ value: count, label: count }))}
            />
            <p className="mt-1.5 text-sm text-muted">
              {vsBot
                ? `You and ${others === 1 ? "1 bot" : `${others} bots`}.`
                : online
                  ? `You and ${others === 1 ? "1 friend" : `${others} friends`}, each on their own phone.`
                  : `${players} people sharing one phone.`}
            </p>
          </div>
        )}

        {online && <NameField value={name} onChange={setTypedName} />}

        {vsBot && config.botLevels !== false && (
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
              { value: "me", label: vsBot ? "You" : config.colors[0] },
              { value: "them", label: vsBot ? botName(1, players) : config.colors[1] },
              { value: "random", label: "Random" },
            ]}
          />
        )}

        <button type="submit" disabled={creating} className="btn btn-primary w-full py-3.5">
          {!online ? "Start" : creating ? "Making a room..." : "Make a room"}
        </button>
        {error && (
          <p role="alert" className="-mt-2 text-sm text-red">
            {error}
          </p>
        )}
      </form>

      <RecordLine gameId={config.game.id} />

      <section aria-labelledby="how-to" className="mt-10 border-t border-line pt-6">
        <h2 id="how-to" className="mb-3 text-lg">
          How to play
        </h2>
        <Rules />
      </section>
    </main>
  );
}

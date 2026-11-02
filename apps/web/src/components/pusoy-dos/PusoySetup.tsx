"use client";

import Link from "next/link";
import { useState } from "react";
import type { BotLevel } from "@laro/games";
import { RecordLine } from "@/components/game/RecordLine";
import { Segmented } from "@/components/game/Segmented";
import { LEVEL_LABELS } from "@/components/game/settings";
import { NameField } from "@/components/room/NameField";
import { PlayWithField, type PlayWith } from "@/components/room/PlayWith";
import { usePlayer } from "@/lib/player";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { useIsOnline } from "@/lib/useIsOnline";
import { Rules } from "./Rules";

/** Hands are secret, so there's no passing one phone around: it's bots or online. */
export type PusoyMode = "bot" | "online";

export function PusoySetup({
  mode,
  onMode,
  level,
  onLevel,
  players,
  onPlayers,
  onStart,
  onStartOnline,
}: {
  mode: PusoyMode;
  onMode: (mode: PusoyMode) => void;
  level: BotLevel;
  onLevel: (level: BotLevel) => void;
  /** How many at the table, counting you. */
  players: number;
  onPlayers: (players: number) => void;
  onStart: () => void;
  /** Makes a room and goes to it, or goes to look for anyone to play. Rejects with a message to show if that fails. */
  onStartOnline: (name: string, anyone: boolean) => Promise<void>;
}) {
  const levels = Object.keys(LEVEL_LABELS) as BotLevel[];
  const online = mode === "online";
  const saved = usePlayer();
  // Null until the player types, so a saved name can fill the box once it loads.
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? saved?.name ?? "";
  const [playWith, setPlayWith] = useState<PlayWith>("friends");
  const anyone = online && playWith === "anyone";
  const [creating, setCreating] = useState(false);
  const connected = useIsOnline();
  const [error, setError] = useState<string | null>(null);
  const others = players - 1;

  let who: string;
  if (!online) who = `You and ${others === 1 ? "1 bot" : `${others} bots`}.`;
  else who = `You and ${others} ${anyone ? "other" : "friend"}${others === 1 ? "" : "s"}, each on their own phone.`;

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
          if (!online) return onStart();
          setCreating(true);
          setError(null);
          onStartOnline(name, anyone).catch((reason: unknown) => {
            setCreating(false);
            setError(reason instanceof Error ? reason.message : "Couldn't make a room. Try again.");
          });
        }}
      >
        {ONLINE_ENABLED && (
          <Segmented<PusoyMode>
            legend="Opponent"
            name="mode"
            value={mode}
            onChange={onMode}
            options={[
              { value: "bot", label: "Bots" },
              { value: "online", label: "Online" },
            ]}
          />
        )}
        {online && (
          <>
            <PlayWithField value={playWith} onChange={setPlayWith} game="pusoy-dos" players={players} />
            <p className="-mt-3 text-sm text-muted">
              {anyone
                ? "You'll play whoever else is looking for a game right now."
                : `You'll get a link to send to ${others === 1 ? "a friend" : "your friends"}.`}
            </p>
          </>
        )}

        <div>
          <Segmented<string>
            legend="Players"
            name="players"
            value={String(players)}
            onChange={(count) => onPlayers(Number(count))}
            options={["2", "3", "4"].map((count) => ({ value: count, label: count }))}
          />
          <p className="mt-1.5 text-sm text-muted">
            {who}
            {players < 4 && " Everyone still gets 13 cards, and the rest of the deck sits out."}
          </p>
        </div>

        {online && <NameField value={name} onChange={setTypedName} />}

        {!online && (
          <Segmented<BotLevel>
            legend="Bot level"
            name="level"
            value={level}
            onChange={onLevel}
            options={levels.map((value) => ({ value, label: LEVEL_LABELS[value] }))}
          />
        )}
        <button type="submit" disabled={creating || (online && !connected)} className="btn btn-primary w-full py-3.5">
          {!online ? "Deal the cards" : anyone ? "Find a game" : creating ? "Making a room..." : "Make a room"}
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

      <RecordLine gameId="pusoy-dos" />

      <section aria-labelledby="how-to" className="mt-10 border-t border-line pt-6">
        <h2 id="how-to" className="mb-3 text-lg">
          How to play
        </h2>
        <Rules />
      </section>
    </main>
  );
}

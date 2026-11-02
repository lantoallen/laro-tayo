"use client";

import type { GameId } from "@laro/rooms";
import { Segmented } from "@/components/game/Segmented";
import { useWaiting } from "@/lib/useWaiting";

/** Online, you can play friends you send a link to, or anyone else looking for the same game right now. */
export type PlayWith = "friends" | "anyone";

export function PlayWithField({
  value,
  onChange,
  game,
  players,
}: {
  value: PlayWith;
  onChange: (value: PlayWith) => void;
  /** The game and table size, to say when someone's already waiting for one. */
  game?: GameId;
  players: number;
}) {
  const waiting = useWaiting();
  const here = game ? (waiting[`${game}/${players}`] ?? 0) : 0;
  return (
    <div>
      <Segmented<PlayWith>
        legend="Play with"
        name="with"
        value={value}
        onChange={onChange}
        options={[
          { value: "friends", label: "Friends" },
          { value: "anyone", label: "Anyone" },
        ]}
      />
      {here > 0 && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold">
          <span aria-hidden="true" className="inline-block size-2 rounded-full bg-red" />
          {players === 2
            ? "Someone's looking for a game right now."
            : `${here} of ${players} players are already waiting.`}
        </p>
      )}
    </div>
  );
}

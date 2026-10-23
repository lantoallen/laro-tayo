"use client";

import { OPPONENTS, useGameRecord, type Opponent, type Tally } from "@/lib/record";
import { LEVEL_LABELS } from "./settings";

const LABELS: Record<Opponent, string> = {
  easy: `${LEVEL_LABELS.easy} bot`,
  medium: `${LEVEL_LABELS.medium} bot`,
  hard: `${LEVEL_LABELS.hard} bot`,
  bot: "Against the bot",
  online: "Online",
};

function describe({ wins, losses, draws }: Tally): string {
  const parts = [`${wins} won`, `${losses} lost`];
  if (draws > 0) parts.push(`${draws} drawn`);
  return parts.join(", ");
}

/** How this phone's player has done at a game, once they've finished a game of it. */
export function RecordLine({ gameId }: { gameId: string }) {
  const record = useGameRecord(gameId);
  const rows = OPPONENTS.flatMap((opponent) => {
    const tally = record?.[opponent];
    return tally ? [{ opponent, tally }] : [];
  });
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="record" className="mt-6 rounded-xl border-2 border-line px-4 py-3 text-sm">
      <h2 id="record" className="font-display text-sm">
        Your record on this phone
      </h2>
      <ul className="mt-1 space-y-0.5">
        {rows.map(({ opponent, tally }) => (
          <li key={opponent} className="flex justify-between gap-3">
            <span className="text-muted">{LABELS[opponent]}</span>
            <span className="tabular-nums">{describe(tally)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

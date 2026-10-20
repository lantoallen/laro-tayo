import type { ReactNode } from "react";

export interface Notice {
  tone: "good" | "bad" | "info";
  text: string;
}

export const NOTICE_CLASSES: Record<Notice["tone"] | "none", string> = {
  good: "border-outline bg-yellow text-yellow-ink",
  bad: "border-red bg-surface text-red",
  info: "border-outline bg-surface",
  none: "border-outline bg-surface",
};

/** A player's name above or below the board, with one number about how they're doing. */
export function PlayerRow({
  name,
  stat,
  active,
  note,
}: {
  name: string;
  stat: { label: string; value: number };
  active: boolean;
  note?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[58rem] items-center justify-between text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${active ? "bg-yellow" : "bg-line"}`} />
        {name}
        {active && <span className="sr-only">(to move)</span>}
        {note && <span className="font-normal text-muted">{note}</span>}
      </span>
      <span className="text-muted">
        {stat.label}: <b className="text-ink tabular-nums">{stat.value}</b>
      </span>
    </div>
  );
}

/** The line under the board: the latest move message, or whose turn it is. */
export function StatusLine({ notice, status }: { notice: Notice | null; status: string }) {
  return (
    <p
      aria-live="polite"
      className={`rounded-xl border-2 px-4 py-2.5 text-center font-semibold ${NOTICE_CLASSES[notice?.tone ?? "none"]}`}
    >
      {notice?.text ?? status}
    </p>
  );
}

/**
 * Shown over the board when a game ends. With `inline` it goes under the board
 * instead, for games where the final board is worth seeing, like a line of four.
 */
export function ResultCard({
  title,
  detail,
  inline = false,
  children,
}: {
  title: string;
  detail: string;
  inline?: boolean;
  children: ReactNode;
}) {
  const card = (
    <div
      role={inline ? "region" : "dialog"}
      aria-labelledby="result-title"
      className={`card w-full p-5 text-center ${inline ? "mx-auto max-w-[32rem]" : "max-w-xs"}`}
    >
      <h2 id="result-title" className="text-2xl font-bold">
        {title}
      </h2>
      <p className="mt-1 text-muted tabular-nums">{detail}</p>
      <div className="mt-5 grid gap-2">{children}</div>
    </div>
  );
  if (inline) return card;
  return <div className="absolute inset-0 z-10 grid place-items-center p-4">{card}</div>;
}

export const PRIMARY_BUTTON = "btn btn-primary";
export const SECONDARY_BUTTON = "btn btn-secondary";

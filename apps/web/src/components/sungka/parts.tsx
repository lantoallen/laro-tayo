import type { ReactNode } from "react";
import { NOTICE_CLASSES, type Notice } from "./notices";

export function PlayerRow({ name, store, active, note }: { name: string; store: number; active: boolean; note?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[58rem] items-center justify-between text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${active ? "bg-yellow" : "bg-line"}`} />
        {name}
        {active && <span className="sr-only">(to move)</span>}
        {note && <span className="font-normal text-muted">{note}</span>}
      </span>
      <span className="text-muted">
        Store: <b className="text-ink tabular-nums">{store}</b>
      </span>
    </div>
  );
}

/** The line under the board: the latest move message, or whose turn it is. */
export function StatusLine({ notice, status }: { notice: Notice | null; status: string }) {
  return (
    <p
      aria-live="polite"
      className={`rounded-lg px-4 py-2.5 text-center font-semibold ${NOTICE_CLASSES[notice?.tone ?? "none"]}`}
    >
      {notice?.text ?? status}
    </p>
  );
}

/** Shown over the board when a game ends. */
export function ResultCard({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center p-4">
      <div
        role="dialog"
        aria-labelledby="result-title"
        className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 text-center shadow-xl"
      >
        <h2 id="result-title" className="text-2xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-muted tabular-nums">{detail}</p>
        <div className="mt-5 grid gap-2">{children}</div>
      </div>
    </div>
  );
}

export const PRIMARY_BUTTON = "rounded-lg bg-blue py-2.5 font-semibold text-blue-ink disabled:opacity-60";
export const SECONDARY_BUTTON = "rounded-lg border border-line py-2.5 text-center font-semibold";

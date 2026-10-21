import type { CSSProperties, ReactNode } from "react";
import "./game.css";

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

/** Whose turn it is, said plainly ("Your turn", "Red's turn"), in that player's color. */
export interface Turn {
  label: string;
  color?: string;
}

/** Colors light enough to need dark text on top. */
const LIGHT_COLORS = new Set(["#fcd116", "#fffaf0"]);

const seatStyle = (color: string | undefined) =>
  color
    ? ({ "--seat": color, "--seat-ink": LIGHT_COLORS.has(color) ? "#1b1b1b" : "#ffffff" } as CSSProperties)
    : undefined;

/**
 * A player's name above or below the board, with one number about how they're
 * doing. The player whose turn it is gets a highlighted row in their color.
 */
export function PlayerRow({
  name,
  stat,
  active,
  note,
  color,
}: {
  name: string;
  stat: { label: string; value: number };
  active: boolean;
  note?: string;
  /** The color this player plays as. */
  color?: string;
}) {
  return (
    <div className={`player-row ${active ? "player-active" : ""}`} style={seatStyle(color)}>
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`player-dot ${color ? "" : "player-dot-plain"}`} />
        <span className="truncate">{name}</span>
        {active && <span className="sr-only">(to move)</span>}
        {note && <span className="font-normal text-muted">{note}</span>}
      </span>
      <span className="shrink-0 text-muted">
        {stat.label}:{" "}
        {/* A new key when the number changes, so it pops. */}
        <b key={stat.value} className="stat-pop inline-block text-ink tabular-nums">
          {stat.value}
        </b>
      </span>
    </div>
  );
}

/**
 * The line under the board. A badge always says whose turn it is, and next to
 * it is the latest message from a move, or what to do next.
 */
export function StatusLine({ notice, status, turn }: { notice: Notice | null; status: string; turn?: Turn | null }) {
  const tone = NOTICE_CLASSES[notice?.tone ?? "none"];
  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-2 rounded-xl border-2 p-2 font-semibold ${tone}`}
    >
      {turn && (
        // A new key when the turn changes, so the badge pops in.
        <span key={turn.label} className="turn-badge" style={seatStyle(turn.color)}>
          {turn.label}
        </span>
      )}
      <span className={`flex-1 ${turn ? "text-left" : "text-center"}`}>{notice?.text ?? status}</span>
    </div>
  );
}

const CONFETTI_COLORS = ["#ce1126", "#0038a8", "#fcd116", "#fffaf0"];

/** Paper confetti in flag colors, for a win. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="confetti">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 37) % 100}%`,
              "--delay": `${(i % 7) * 70}ms`,
              "--spin": `${(i % 2 ? 1 : -1) * (200 + ((i * 53) % 300))}deg`,
              "--drift": `${((i * 29) % 60) - 30}px`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Shown over the board when a game ends. With `inline` it goes under the board
 * instead, for games where the final board is worth seeing, like a line of four.
 * `celebrate` adds confetti, for a win.
 */
export function ResultCard({
  title,
  detail,
  inline = false,
  celebrate = false,
  children,
}: {
  title: string;
  detail: string;
  inline?: boolean;
  celebrate?: boolean;
  children: ReactNode;
}) {
  const card = (
    <div
      role={inline ? "region" : "dialog"}
      aria-labelledby="result-title"
      className={`result-card card relative w-full p-5 text-center ${inline ? "mx-auto max-w-[32rem]" : "max-w-xs"}`}
    >
      {celebrate && <Confetti />}
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

"use client";

import { useEffect, useState } from "react";
import { LADDERS, LAST_SQUARE, SNAKES, type SnakesMove, type SnakesState } from "@laro/games/snakes-and-ladders";
import { Die } from "@/components/board-game/Die";
import type { BoardProps } from "@/components/board-game/types";
import { playSound } from "@/lib/sound";
import "./snakes.css";

const COLORS = ["red", "blue", "yellow", "green"] as const;
/** Where pieces sit when they share a square: side by side for two, in a square for more. */
const SPREAD = {
  2: [
    [-0.18, 0],
    [0.18, 0],
  ],
  4: [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ],
} as const;
/** How long a piece takes to walk to its square before it climbs or slides. */
const WALK_MS = 650;

/** The center of a square on a 10 by 10 grid. Square 1 is bottom left, and rows go back and forth. */
function centerOf(square: number) {
  const rowFromBottom = Math.floor((square - 1) / 10);
  const along = (square - 1) % 10;
  const col = rowFromBottom % 2 === 0 ? along : 9 - along;
  return { x: col + 0.5, y: 9 - rowFromBottom + 0.5 };
}

/** The squares in the order they're drawn: top row first, left to right. */
const DRAWN = Array.from({ length: 100 }, (_, i) => {
  const rowFromTop = Math.floor(i / 10);
  const col = i % 10;
  const rowFromBottom = 9 - rowFromTop;
  return rowFromBottom * 10 + (rowFromBottom % 2 === 0 ? col : 9 - col) + 1;
});

function Ladder({ from, to }: { from: number; to: number }) {
  const a = centerOf(from);
  const b = centerOf(to);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  const [px, py] = [-uy * 0.2, ux * 0.2];
  const rungs = Array.from({ length: Math.floor((length - 0.3) / 0.45) }, (_, i) => 0.35 + i * 0.45);
  return (
    <g className="sl-ladder">
      <line x1={a.x + px} y1={a.y + py} x2={b.x + px} y2={b.y + py} />
      <line x1={a.x - px} y1={a.y - py} x2={b.x - px} y2={b.y - py} />
      {rungs.map((t) => (
        <line key={t} x1={a.x + ux * t + px} y1={a.y + uy * t + py} x2={a.x + ux * t - px} y2={a.y + uy * t - py} />
      ))}
    </g>
  );
}

function Snake({ head, tail }: { head: number; tail: number }) {
  const h = centerOf(head);
  const t = centerOf(tail);
  const [vx, vy] = [t.x - h.x, t.y - h.y];
  const length = Math.hypot(vx, vy);
  // Bend the body into an S, wider for longer snakes.
  const bend = Math.min(1.2, 0.35 + length * 0.12);
  const [px, py] = [(-vy / length) * bend, (vx / length) * bend];
  // Two control points a third and two thirds of the way along, pushed to opposite sides.
  const first = `${h.x + vx / 3 + px} ${h.y + vy / 3 + py}`;
  const second = `${h.x + (2 * vx) / 3 - px} ${h.y + (2 * vy) / 3 - py}`;
  const body = `M${h.x} ${h.y} C${first} ${second} ${t.x} ${t.y}`;
  return (
    <g className="sl-snake">
      <path d={body} className="sl-snake-outline" />
      <path d={body} className="sl-snake-body" />
      <path d={body} className="sl-snake-spots" />
      <circle cx={h.x} cy={h.y} r="0.24" className="sl-snake-head" />
      <circle cx={h.x - 0.08} cy={h.y - 0.06} r="0.05" fill="#fffaf0" />
      <circle cx={h.x + 0.08} cy={h.y - 0.06} r="0.05" fill="#fffaf0" />
    </g>
  );
}

export function SnakesBoard({ state, onMove }: BoardProps<SnakesState, SnakesMove>) {
  const last = state.last;
  // A piece that hit a ladder or snake walks to that square first, then climbs or slides once this matches.
  const [jumped, setJumped] = useState(state.turns);
  const midJump = last !== null && last.jump !== null && jumped !== state.turns;

  useEffect(() => {
    if (!last?.jump || jumped === state.turns) return;
    const timer = setTimeout(() => {
      playSound(last.jump === "ladder" ? "climb" : "slide");
      setJumped(state.turns);
    }, WALK_MS);
    return () => clearTimeout(timer);
  }, [jumped, last, state.turns]);

  const shownAt = (seat: number) => (midJump && last.seat === seat ? last.landed : state.positions[seat]);
  const seats = state.positions.map((_, seat) => seat);
  /** How far to shift a piece so pieces on the same square don't hide each other. */
  const nudge = (seat: number) => {
    const together = seats.filter((other) => shownAt(other) === shownAt(seat));
    if (together.length === 1) return [0, 0];
    const spots = together.length === 2 ? SPREAD[2] : SPREAD[4];
    return spots[together.indexOf(seat)];
  };

  return (
    <div className="sl-wrap">
      <div className="sl-board">
        {DRAWN.map((square) => (
          <div
            key={square}
            className={`sl-square ${square % 2 === 0 ? "sl-even" : ""} ${square === LAST_SQUARE ? "sl-goal" : ""}`}
          >
            <span>{square}</span>
          </div>
        ))}
        <svg viewBox="0 0 10 10" className="sl-art" aria-hidden="true">
          {Object.entries(LADDERS).map(([from, to]) => (
            <Ladder key={from} from={Number(from)} to={to} />
          ))}
          {Object.entries(SNAKES).map(([head, tail]) => (
            <Snake key={head} head={Number(head)} tail={tail} />
          ))}
        </svg>
        {seats.map((seat) => {
          const square = shownAt(seat);
          if (square === 0) return null;
          const { x, y } = centerOf(square);
          const [dx, dy] = nudge(seat);
          return (
            <span
              key={seat}
              role="img"
              aria-label={`${COLORS[seat]} on square ${square}`}
              className={`sl-token sl-${COLORS[seat]}`}
              style={{ left: `${(x + dx) * 10}%`, top: `${(y + dy) * 10}%` }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-h-8 items-center gap-2 text-sm text-muted">
          {seats.some((seat) => shownAt(seat) === 0) && (
            <>
              Start:
              {seats.map(
                (seat) =>
                  shownAt(seat) === 0 && (
                    <span
                      key={seat}
                      role="img"
                      aria-label={`${COLORS[seat]} at the start`}
                      className={`sl-token sl-${COLORS[seat]} sl-waiting`}
                    />
                  ),
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Die value={last?.roll ?? null} rollKey={state.turns} />
          {onMove && (
            <button type="button" onClick={() => onMove("roll")} className="btn btn-primary">
              Roll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

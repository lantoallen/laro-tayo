"use client";

import { useState } from "react";
import { legalMoves, millsAt, type MorrisMove, type MorrisState } from "@laro/games/morris";
import type { BoardProps } from "@/components/board-game/types";
import "./morris.css";

/** Where each point sits on a 7 by 7 grid, as [column, row]. */
const SPOTS: [number, number][] = [
  [0, 0],
  [3, 0],
  [6, 0],
  [1, 1],
  [3, 1],
  [5, 1],
  [2, 2],
  [3, 2],
  [4, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [2, 4],
  [3, 4],
  [4, 4],
  [1, 5],
  [3, 5],
  [5, 5],
  [0, 6],
  [3, 6],
  [6, 6],
];
const COLORS = ["red", "blue"] as const;
/** Space around the board, and between grid lines, as a percentage of its width. */
const PAD = 8;
const STEP = (100 - 2 * PAD) / 6;

/**
 * The three squares and the lines joining them. Tap a point to place a piece,
 * tap a piece and then a point to move it, or tap a marked piece to take it.
 */
export function MorrisBoard({ state, onMove }: BoardProps<MorrisState, MorrisMove>) {
  // The piece picked up to move, remembered with the move count so it's dropped once the board changes.
  const [picked, setPicked] = useState<{ turns: number; point: number } | null>(null);
  const selected = picked?.turns === state.turns ? picked.point : null;
  const moves = onMove && state.turn !== null ? legalMoves(state, state.turn) : [];

  const placeable = new Set(moves.flatMap((move) => ("place" in move ? [move.place] : [])));
  const takeable = new Set(moves.flatMap((move) => ("take" in move ? [move.take] : [])));
  const movable = new Set(moves.flatMap((move) => ("from" in move ? [move.from] : [])));
  const targets = new Set(moves.flatMap((move) => ("from" in move && move.from === selected ? [move.to] : [])));

  function tap(point: number) {
    if (!onMove) return;
    if (placeable.has(point)) onMove({ place: point });
    else if (takeable.has(point)) onMove({ take: point });
    else if (selected !== null && targets.has(point)) onMove({ from: selected, to: point });
    else if (movable.has(point)) setPicked(point === selected ? null : { turns: state.turns, point });
  }

  const last = state.last;
  // The mill just made, while its owner picks a piece to take.
  const mill = new Set(state.taking && last?.to != null ? millsAt(state.board, last.to).flat() : []);
  return (
    <div className="mr-board">
      <svg viewBox="0 0 6 6" className="mr-lines" aria-hidden="true" style={{ inset: `${PAD}%` }}>
        <rect x="0" y="0" width="6" height="6" />
        <rect x="1" y="1" width="4" height="4" />
        <rect x="2" y="2" width="2" height="2" />
        <path d="M3 0V2M3 4V6M0 3H2M4 3H6" />
      </svg>
      {SPOTS.map(([col, row], point) => {
        const owner = state.board[point];
        const tappable = placeable.has(point) || takeable.has(point) || targets.has(point) || movable.has(point);
        const className = [
          "mr-point",
          owner !== null && `mr-piece mr-${COLORS[owner]}`,
          takeable.has(point) && "mr-takeable",
          movable.has(point) && selected === null && "mr-movable",
          selected === point && "mr-selected",
          (placeable.has(point) || targets.has(point)) && "mr-target",
          last && (last.to === point || last.from === point) && "mr-last",
          last?.taken === point && "mr-taken",
          mill.has(point) && "mr-mill",
        ]
          .filter(Boolean)
          .join(" ");
        const style = { left: `${PAD + col * STEP}%`, top: `${PAD + row * STEP}%` };
        const what = owner === null ? "empty" : COLORS[owner];
        const label = `Point ${point + 1}: ${what}${takeable.has(point) ? ", take this piece" : ""}`;
        if (!tappable) {
          return <span key={point} role="img" aria-label={label} className={className} style={style} />;
        }
        return (
          <button
            key={point}
            type="button"
            aria-label={label}
            onClick={() => tap(point)}
            className={className}
            style={style}
          />
        );
      })}
    </div>
  );
}

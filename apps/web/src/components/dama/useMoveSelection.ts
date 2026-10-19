"use client";

import { useState } from "react";
import type { DamaMove } from "@laro/games/dama";

const samePrefix = (move: readonly number[], prefix: readonly number[]) =>
  prefix.every((square, i) => move[i] === square);

/**
 * Tap-to-move for Dama: tap a piece, then each square it lands on. It works from
 * whatever moves are legal right now, so a half-picked move that stops being
 * legal, for example because the turn passed, is dropped.
 */
export function useMoveSelection(moves: readonly DamaMove[]) {
  const [picked, setPicked] = useState<number[]>([]);
  // The piece being moved, then any landing squares picked so far.
  const selection = picked.length > 0 && moves.some((move) => samePrefix(move, picked)) ? picked : [];
  const movable = [...new Set(moves.map((move) => move[0]))];
  const targets =
    selection.length === 0
      ? []
      : [
          ...new Set(
            moves
              .filter((move) => move.length > selection.length && samePrefix(move, selection))
              .map((move) => move[selection.length]),
          ),
        ];

  /** Handles a tap. Returns the whole move once its last square is tapped, and null until then. */
  function tap(square: number): DamaMove | null {
    if (targets.includes(square)) {
      const next = [...selection, square];
      const complete = moves.find((move) => move.length === next.length && samePrefix(move, next));
      setPicked(complete ? [] : next);
      return complete ?? null;
    }
    if (movable.includes(square) && selection.length <= 1) setPicked(selection[0] === square ? [] : [square]);
    return null;
  }

  return { selection, movable, targets, tap };
}

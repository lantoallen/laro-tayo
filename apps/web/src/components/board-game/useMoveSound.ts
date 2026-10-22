"use client";

import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sound";
import type { Seat } from "@laro/games";
import type { BoardGameConfig } from "./types";

/** Plays the sound for each new move. `moves` counts the moves so far, and going back to 0 starts a new game. */
export function useMoveSound<State, Move>(
  config: BoardGameConfig<State, Move>,
  state: State,
  moves: number,
  you: Seat | null,
) {
  const heard = useRef(moves);
  useEffect(() => {
    const isNew = moves > heard.current;
    heard.current = moves;
    if (!isNew) return;
    const sound = config.sound(state, you);
    if (sound) playSound(sound);
    // Only a new move should make a sound, not every new copy of the same position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves]);
}

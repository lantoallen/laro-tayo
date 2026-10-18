"use client";

import { useEffect } from "react";
import { chooseMove, setup } from "@laro/games/sungka";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Board } from "./Board";
import { DELAYS, useSowing } from "./useSowing";

const NAMES: [string, string] = ["Bot 1", "Bot 2"];
const PAUSE_AFTER_GAME_MS = 3000;

/** Two bots playing each other on a loop, for the home page. It holds still for reduced motion. */
export function SungkaDemo() {
  const reduceMotion = usePrefersReducedMotion();
  const { game, sowing, frame, board, move, restart } = useSowing(() => setup(), "normal");

  useEffect(() => {
    if (reduceMotion || sowing) return;
    const over = game.turn === null;
    const timer = setTimeout(
      () => {
        if (over) restart(setup({ firstSeat: Math.random() < 0.5 ? 0 : 1 }));
        else move(game.turn!, chooseMove(game, game.turn!, { level: "medium", rng: Math.random }));
      },
      over ? PAUSE_AFTER_GAME_MS : DELAYS.normal.think,
    );
    return () => clearTimeout(timer);
    // `move` and `restart` are recreated every render but only read `game`, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, sowing, game]);

  return (
    <div inert>
      <Board
        board={board}
        names={NAMES}
        playable={[]}
        onPlay={() => {}}
        active={frame?.active}
        hand={frame?.hand}
        captured={frame?.captured}
        className="sk-small"
      />
    </div>
  );
}

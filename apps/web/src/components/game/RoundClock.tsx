"use client";

import { useEffect, useRef, useState } from "react";

/** Under this many seconds, the clock turns red. */
const HURRY_SECONDS = 3;

/**
 * The time left to move this round: a bar that runs down, and the seconds
 * left. Give it a new key each round so it starts again.
 */
export function RoundClock({ ms, onTimeUp }: { ms: number; onTimeUp?: () => void }) {
  const [left, setLeft] = useState(Math.ceil(ms / 1000));
  // The latest callback, so a new one each render doesn't start the clock again.
  const timeUp = useRef(onTimeUp);
  useEffect(() => {
    timeUp.current = onTimeUp;
  });

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil((ms - (Date.now() - start)) / 1000))), 200);
    const end = setTimeout(() => timeUp.current?.(), ms);
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [ms]);

  return (
    <div className={`round-clock ${left <= HURRY_SECONDS ? "round-clock-hurry" : ""}`} role="timer" aria-live="off">
      <span className="round-clock-track" aria-hidden="true">
        <span className="round-clock-bar" style={{ animationDuration: `${ms}ms` }} />
      </span>
      <span className="round-clock-text">
        {left}
        <span className="sr-only"> seconds left to pick</span>
        <span aria-hidden="true">s</span>
      </span>
    </div>
  );
}

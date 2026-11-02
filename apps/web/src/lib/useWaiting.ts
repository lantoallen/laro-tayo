"use client";

import { useEffect, useState } from "react";
import { ONLINE_ENABLED, ROOMS_URL } from "./rooms";

/** How often to ask again while the page is open. */
const EVERY_MS = 30_000;

/**
 * How many people are looking for a game with anyone right now, by game and
 * table size, like { "dama/2": 1 }. Empty until the server answers, and when
 * nobody is looking.
 */
export function useWaiting(): Record<string, number> {
  const [waiting, setWaiting] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!ONLINE_ENABLED) return;
    let stopped = false;
    async function ask() {
      // A tab in the background doesn't need to know, and asking costs the server a little each time.
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`${ROOMS_URL}/match/waiting`);
        const data = (await response.json()) as { waiting?: Record<string, number> };
        if (!stopped && data.waiting) setWaiting(data.waiting);
      } catch {
        // Offline or the server is busy. The next try may work.
      }
    }
    ask();
    const timer = setInterval(ask, EVERY_MS);
    document.addEventListener("visibilitychange", ask);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ask);
    };
  }, []);

  return waiting;
}

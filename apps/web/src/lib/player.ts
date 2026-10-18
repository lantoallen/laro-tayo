"use client";

import { useSyncExternalStore } from "react";
import { cleanName } from "@laro/rooms";

/** Who this browser plays as online. The id lets a player get their seat back after a dropped connection. */
export interface LocalPlayer {
  id: string;
  name: string;
}

const KEY = "laro-tayo:player";
const listeners = new Set<() => void>();
let cached: LocalPlayer | null | undefined;

function read(): LocalPlayer | null {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const name = cleanName(data?.name);
    if (typeof data?.id === "string" && name) return { id: data.id, name };
  } catch {
    // Storage can be blocked or hold something unexpected. Asking for a name again is fine.
  }
  return null;
}

function snapshot(): LocalPlayer | null {
  if (cached === undefined) cached = read();
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The saved player, or null until they pick a name. */
export function usePlayer(): LocalPlayer | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function savePlayerName(name: string): LocalPlayer {
  const player = { id: snapshot()?.id ?? crypto.randomUUID(), name: cleanName(name) || "Player" };
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    // Without storage the name still works until the page is closed.
  }
  cached = player;
  for (const listener of listeners) listener();
  return player;
}

function subscribeNever() {
  return () => {};
}

/** False during the server render and the first client render, then true. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

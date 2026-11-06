"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { NIM } from "./config";

export function NimApp() {
  return <BoardGameApp config={NIM} />;
}

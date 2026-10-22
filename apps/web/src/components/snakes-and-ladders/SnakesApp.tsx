"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { SNAKES_AND_LADDERS } from "./config";

export function SnakesApp() {
  return <BoardGameApp config={SNAKES_AND_LADDERS} />;
}

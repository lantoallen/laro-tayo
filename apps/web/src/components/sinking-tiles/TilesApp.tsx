"use client";

import { useState } from "react";
import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { Segmented } from "@/components/game/Segmented";
import { SINKING_TILES, SINKING_TILES_TOGETHER } from "./config";

type Pace = "turns" | "together";

export function TilesApp() {
  const [pace, setPace] = useState<Pace>("turns");
  const choices = (
    <div>
      <Segmented<Pace>
        legend="How to move"
        name="pace"
        value={pace}
        onChange={setPace}
        options={[
          { value: "turns", label: "Take turns" },
          { value: "together", label: "All at once" },
        ]}
      />
      <p className="mt-1.5 text-sm text-muted">
        {pace === "turns"
          ? "One player steps at a time."
          : "You get 10 seconds to pick each round. Play it against bots or online, not on one phone."}
      </p>
    </div>
  );
  return <BoardGameApp config={pace === "turns" ? SINKING_TILES : SINKING_TILES_TOGETHER} choices={choices} />;
}

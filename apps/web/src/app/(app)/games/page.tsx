import type { Metadata } from "next";
import { GameList } from "@/components/games/GameList";
import { About } from "@/components/landing/About";
import { JoinByCode } from "@/components/room/JoinByCode";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { WaysToPlay } from "@/components/landing/WaysToPlay";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Games",
  description: "Pick a game to play on your phone: Filipino favorites and classics.",
};

/** The home page inside the app: every game first, then how playing works. */
export default function GamesPage() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4">
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h1 className="text-3xl font-bold">Pick a game</h1>
          <JoinByCode />
        </div>
        <GameList />
        <WaysToPlay />
        <LiveDemo />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}

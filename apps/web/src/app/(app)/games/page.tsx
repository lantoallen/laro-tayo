import type { Metadata } from "next";
import { GameList } from "@/components/games/GameList";
import { About } from "@/components/landing/About";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { WaysToPlay } from "@/components/landing/WaysToPlay";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Games",
  description: "Pick a Filipino game to play on your phone.",
};

/** The home page inside the app: every game first, then how playing works. */
export default function GamesPage() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4">
        <h1 className="mt-4 text-3xl font-bold">Pick a game</h1>
        <GameList />
        <WaysToPlay />
        <LiveDemo />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}

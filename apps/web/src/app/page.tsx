import { About } from "@/components/landing/About";
import { GameList } from "@/components/landing/GameList";
import { Hero } from "@/components/landing/Hero";
import { WaysToPlay } from "@/components/landing/WaysToPlay";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-10">
      <Hero />
      <GameList />
      <WaysToPlay />
      <About />
    </main>
  );
}

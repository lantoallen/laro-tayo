import { About } from "@/components/landing/About";
import { Hero } from "@/components/landing/Hero";
import { WaysToPlay } from "@/components/landing/WaysToPlay";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4">
        <Hero />
        <WaysToPlay />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}

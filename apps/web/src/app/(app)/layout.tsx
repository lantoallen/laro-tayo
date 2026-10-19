import type { ReactNode } from "react";
import Link from "next/link";
import { SunMark } from "@/components/SunMark";

/** The header for every page inside the app. The start screen at / goes without it. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/games" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <SunMark className="size-6" />
          Laro Tayo!
        </Link>
        <nav aria-label="Main">
          <Link href="/games" className="rounded-lg px-3 py-2 font-semibold hover:bg-surface">
            Games
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}

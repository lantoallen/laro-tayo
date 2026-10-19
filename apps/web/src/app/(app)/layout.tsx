import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/** The header for every page inside the app. The start screen at / goes without it. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/games" className="text-base">
          <Logo />
        </Link>
        <nav aria-label="Main">
          <Link href="/games" className="btn btn-secondary btn-small">
            Games
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}

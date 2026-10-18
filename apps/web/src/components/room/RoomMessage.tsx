import type { ReactNode } from "react";

/** A simple page for room states that aren't a game yet: loading, missing, or not set up. */
export function RoomMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-16">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children && <div className="mt-3 space-y-4 text-muted">{children}</div>}
    </main>
  );
}

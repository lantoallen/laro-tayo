"use client";

import { useEffect, useRef, type ReactNode } from "react";

const BACKDROP = "backdrop:bg-black/50";

/**
 * The Rules button that opens a game's rules in a dialog. With `firstVisit` set
 * to the game's id, the rules also open by themselves the first time someone
 * plays that game on this device.
 */
export function RulesButton({ children, firstVisit }: { children: ReactNode; firstVisit?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!firstVisit) return;
    const key = `laro-tayo:rules-seen:${firstVisit}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "yes");
    } catch {
      // Without storage there's no way to tell a first visit, so don't interrupt.
      return;
    }
    dialog.current?.showModal();
  }, [firstVisit]);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="btn btn-secondary btn-small h-9">
        Rules
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="rules-title"
        className={`card m-auto max-h-[85svh] w-[min(32rem,calc(100%-2rem))] overflow-y-auto p-5 text-ink ${BACKDROP}`}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <h2 id="rules-title" className="mb-3 text-lg font-bold">
          How to play
        </h2>
        {children}
        <form method="dialog" className="mt-5">
          <button className="btn btn-primary w-full">Got it</button>
        </form>
      </dialog>
    </>
  );
}

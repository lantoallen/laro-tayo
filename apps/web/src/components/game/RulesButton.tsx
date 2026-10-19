"use client";

import { useRef, type ReactNode } from "react";

/** The "?" button that opens a game's rules in a dialog. */
export function RulesButton({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="How to play"
        className="btn btn-secondary btn-small size-9 px-0"
      >
        ?
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="rules-title"
        className="card m-auto w-[min(32rem,calc(100%-2rem))] p-5 text-ink backdrop:bg-black/50"
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

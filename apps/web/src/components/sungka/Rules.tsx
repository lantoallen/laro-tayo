"use client";

import { useRef } from "react";

export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>
          Each player has 7 small houses and a big store on their left. Every house starts with 7 shells.
        </li>
        <li>
          Pick up all the shells in one of your houses and drop them one at a time, clockwise. Drop one in your own
          store as you pass it, but skip your opponent&apos;s.
        </li>
        <li>If your last shell lands in your store, you go again.</li>
        <li>If it lands in a house that already has shells, pick those up and keep going.</li>
        <li>
          If it lands in an empty house on your side, you capture it plus every shell in the house across, and they go
          to your store.
        </li>
        <li>If it lands in an empty house on the other side, your turn is over.</li>
        <li>
          If your side is empty, your turn is skipped. The game ends when every shell is in a store, and whoever has
          more wins.
        </li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        In the traditional game, both players make their first move at the same time. Here you take turns from the
        start.
      </p>
    </>
  );
}

export function RulesButton() {
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
        <Rules />
        <form method="dialog" className="mt-5">
          <button className="btn btn-primary w-full">Got it</button>
        </form>
      </dialog>
    </>
  );
}

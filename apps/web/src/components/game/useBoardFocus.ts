"use client";

import { useEffect, useRef } from "react";

/** How soon a button has to come back for focus to go back to it. */
const BACK_SOON_MS = 2000;

/** What a control on the board is called, to find it again after it's drawn anew. */
const nameOf = (element: Element) => element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "";

/**
 * Keeps keyboard focus on the board, for people playing with a keyboard or a
 * screen reader. The squares and buttons you can press come and go with every
 * move, and the Start button goes away once a game begins. When the focused one
 * goes away, focus would fall back to the top of the page. Instead it goes to
 * the board, one Tab from its first square, and back to the same button if that
 * comes back, like Roll once a roll has played out. Give the returned ref to the
 * element around the board, which needs `tabIndex={-1}`.
 */
export function useBoardFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // Whether focus was last somewhere on the board, and on what.
  const onBoard = useRef(false);
  const lastName = useRef<string | null>(null);
  // When focus fell back to the board, since only a button that's back soon after gets focus again.
  const lostAt = useRef(0);

  useEffect(() => {
    const board = ref.current;
    if (!board) return;
    const enter = (event: FocusEvent) => {
      onBoard.current = true;
      if (event.target !== board && event.target instanceof Element) lastName.current = nameOf(event.target);
    };
    // Leaving for somewhere else on the page. When the focused square is removed, there's nowhere it went.
    const leave = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && !board.contains(event.relatedTarget)) onBoard.current = false;
    };
    // A dialog, like the rules shown on someone's first game, hands focus back to whatever opened it when it closes.
    // If that was the Start button, it's gone, so the board takes it instead.
    const closed = () => {
      setTimeout(() => {
        if (document.activeElement === document.body) board.focus({ preventScroll: true });
      });
    };
    board.addEventListener("focusin", enter);
    board.addEventListener("focusout", leave);
    // Dialogs' close events don't bubble, so they're caught on the way down.
    document.addEventListener("close", closed, true);
    // A game that has just started, with nothing focused: the button that started it is gone.
    if (document.activeElement === document.body) board.focus({ preventScroll: true });
    return () => {
      board.removeEventListener("focusin", enter);
      board.removeEventListener("focusout", leave);
      document.removeEventListener("close", closed, true);
    };
  }, []);

  // After every update: if the focused button went away, focus the board, and the button again if it's back soon,
  // like Roll after a roll has played out. Not much later, like Pass on your next turn, where Enter would pass again.
  useEffect(() => {
    const board = ref.current;
    if (!board || !onBoard.current) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body && active !== board) return;
    if (active !== board) {
      lostAt.current = Date.now();
      board.focus({ preventScroll: true });
    }
    const name = lastName.current;
    if (!name || Date.now() - lostAt.current > BACK_SOON_MS) return;
    const again = [...board.querySelectorAll<HTMLElement>("button:not(:disabled)")].find((b) => nameOf(b) === name);
    again?.focus({ preventScroll: true });
  });

  return ref;
}

/**
 * Reads each move out to screen readers, and shows nothing on screen. `moment`
 * changes with every move, so the same words are read again when a move repeats,
 * like two rolls of 3 in a row.
 */
export function MoveSaid({ text, moment }: { text: string | null; moment: number | string }) {
  return (
    <div className="sr-only" aria-live="polite">
      {text && <p key={moment}>{text}</p>}
    </div>
  );
}

/** "You" for whoever is looking at the screen, and their name for everyone else. */
export function who(seat: number, names: readonly string[], you: number | null): string {
  return seat === you ? "You" : names[seat];
}

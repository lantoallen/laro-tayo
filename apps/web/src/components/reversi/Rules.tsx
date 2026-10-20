export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Black and white take turns placing a disc on the board.</li>
        <li>
          Each disc you place has to trap at least one line of the other player&apos;s discs between it and another of
          yours: across, up and down, or diagonally. Every trapped disc flips to your color.
        </li>
        <li>If you have no move that traps anything, you pass and the other player goes again.</li>
        <li>The game ends when neither player can move. Whoever has more discs wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        The yellow dots show where you can play. Corners can never be flipped back, so they&apos;re worth a lot.
      </p>
    </>
  );
}

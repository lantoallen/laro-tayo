export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Each player has nine pieces. Take turns placing them on the empty points.</li>
        <li>
          Three of your pieces in a line is a mill. Each time you make one, take one of the other player&apos;s pieces.
          Pieces in a mill are safe unless every piece they have is in one.
        </li>
        <li>Once all the pieces are placed, take turns moving one of yours along a line to the next empty point.</li>
        <li>With only three pieces left, yours can jump to any empty point.</li>
        <li>You win when the other player is down to two pieces or can&apos;t move.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        If 50 moves go by without a piece being taken, the game is a draw. To move, tap one of your pieces, then where
        it should go.
      </p>
    </>
  );
}

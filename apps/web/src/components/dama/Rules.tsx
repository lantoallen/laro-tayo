export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Each player starts with 12 pieces on the dark squares of the three rows nearest them.</li>
        <li>Pieces move one square diagonally forward onto an empty square.</li>
        <li>
          Capture by jumping diagonally over an opponent&apos;s piece onto the empty square behind it. Pieces can capture
          backward too.
        </li>
        <li>
          If you can capture, you have to. If you can keep jumping, you have to, and you must take the line that
          captures the most pieces.
        </li>
        <li>
          A piece that ends its move on the far row becomes a king. Kings move and capture any distance along a
          diagonal.
        </li>
        <li>
          You win by capturing all of your opponent&apos;s pieces or leaving them with no moves. After 40 moves in a
          row with no captures and no regular piece moved, the game is a draw.
        </li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        To move, tap one of your pieces, then the square to land on. For a jump over several pieces, tap each landing
        square in order.
      </p>
    </>
  );
}

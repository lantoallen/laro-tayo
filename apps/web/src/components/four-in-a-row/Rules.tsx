export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Players take turns dropping a disc into one of the seven columns. It falls to the lowest empty space.</li>
        <li>Get four of your discs in a line: across, up and down, or diagonally.</li>
        <li>If the board fills up before anyone does, it&apos;s a draw.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Tap a column to drop your disc. Watch for the other player&apos;s lines of three and block them.
      </p>
    </>
  );
}

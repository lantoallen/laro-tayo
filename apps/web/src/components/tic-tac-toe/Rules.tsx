export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>X and O take turns marking an empty square.</li>
        <li>Get three of your marks in a line: across, up and down, or diagonally.</li>
        <li>If all nine squares fill up first, it&apos;s a draw.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">The hard bot never loses, so a draw against it is a good result.</p>
    </>
  );
}

export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Players take turns drawing a line between two dots that are next to each other, across or up and down.</li>
        <li>Draw the fourth side of a box to claim it. Then you go again.</li>
        <li>Once every box is claimed, whoever has more boxes wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Try not to draw the third side of a box, because that hands it to the other player. Near the end every line
        gives something away, so give away as little as you can.
      </p>
    </>
  );
}

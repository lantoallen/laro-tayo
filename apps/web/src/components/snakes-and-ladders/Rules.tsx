export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Two to four players start off the board. On your turn, tap the die to roll it.</li>
        <li>
          Then move your piece yourself: tap the glowing square, or your piece, once for each step. The dots show how
          far you have left to go.
        </li>
        <li>
          Stop at the bottom of a ladder and tap it to climb to the top. Stop on a snake&apos;s head and tap it to slide
          down to its tail.
        </li>
        <li>The first to land exactly on square 100 wins. A roll that would go past 100 doesn&apos;t move you.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">It&apos;s all luck, so the bot has no levels.</p>
    </>
  );
}

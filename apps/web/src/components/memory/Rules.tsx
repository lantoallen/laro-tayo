export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>30 cards are laid face down: 15 pairs.</li>
        <li>On your turn, turn over two cards. If they match, you keep them.</li>
        <li>
          If they don&apos;t match, they stay up until the next card is turned, then go back face down. Try to
          remember where they were.
        </li>
        <li>Either way, it&apos;s then the next player&apos;s turn.</li>
        <li>Once every pair is taken, whoever has the most pairs wins. A tie for the most shares the win.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        The bot&apos;s memory gets better with each level. On hard it never forgets a card.
      </p>
    </>
  );
}

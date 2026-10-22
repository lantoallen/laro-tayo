export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>
          Two to four players get 13 cards each. With fewer than four, the rest of the deck sits out. Cards rank
          from 3 (lowest) up to 2 (highest). When two cards have the same rank, the suit decides: clubs, spades,
          hearts, then diamonds (highest).
        </li>
        <li>
          Whoever has the 3♣ goes first, and their first play has to include it. With fewer than four players the 3♣
          might not be dealt, so whoever has the lowest card goes first and plays that instead.
        </li>
        <li>
          You can play one card, a pair, three of a kind, or a five-card hand. Five-card hands from weakest to
          strongest: a straight, a flush, a full house, four of a kind with any fifth card, and a straight flush.
        </li>
        <li>
          The next players have to beat it with the same number of cards, or pass. Passing doesn&apos;t take you out
          of the round.
        </li>
        <li>When everyone else passes, the last player to play starts a new round with anything they like.</li>
        <li>The first player to get rid of all their cards wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        In this version a 2 can&apos;t be part of a straight, and flushes are compared by suit first. To play, tap
        cards to pick them, then tap Play.
      </p>
    </>
  );
}

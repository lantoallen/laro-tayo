import type { MouseEvent } from "react";
import { RANKS, SUITS, cardName, rankOf, suitOf, type Card } from "@laro/games/pusoy-dos";
import "./pusoy.css";

/**
 * What a card is called out loud. Picture cards and aces start with the letter
 * shown on them, like "J, jack of diamonds", so someone using voice control can
 * say what they see.
 */
function spokenName(card: Card): string {
  const rank = RANKS[rankOf(card)];
  return /^\d/.test(rank) ? cardName(card) : `${rank}, ${cardName(card)}`;
}

/** One card, face up. Hearts and diamonds are red. */
export function PlayingCard({
  card,
  small = false,
  selected = false,
  lifted = false,
  onTap,
}: {
  card: Card;
  small?: boolean;
  selected?: boolean;
  /** Being dragged, so the card in the hand only shows where it came from. */
  lifted?: boolean;
  onTap?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const suit = SUITS[suitOf(card)];
  const className = [
    "pd-card",
    small && "pd-small",
    suitOf(card) >= 2 && "pd-red",
    selected && "pd-selected",
    lifted && "pd-lifted",
  ]
    .filter(Boolean)
    .join(" ");
  const face = (
    <>
      <span className="pd-corner" aria-hidden="true">
        <span>{RANKS[rankOf(card)]}</span>
        <span>{suit}</span>
      </span>
      <span className="pd-pip" aria-hidden="true">
        {suit}
      </span>
    </>
  );

  if (!onTap) {
    return (
      <span className={className} role="img" aria-label={spokenName(card)}>
        {face}
      </span>
    );
  }
  return (
    <button
      type="button"
      data-card={card}
      className={className}
      onClick={onTap}
      aria-pressed={selected}
      aria-label={spokenName(card)}
    >
      {face}
    </button>
  );
}

/** The back of a card, for the bots' hands. */
export function CardBack({ small = false }: { small?: boolean }) {
  return <span className={`pd-card pd-back ${small ? "pd-small" : ""}`} aria-hidden="true" />;
}

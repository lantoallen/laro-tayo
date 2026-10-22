import "./die.css";

/** Where the pips go on a 3 by 3 grid, for each face. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * A die showing `value`, or blank before the first roll. A new `rollKey` makes
 * it tumble, so the same number rolled twice in a row still shows a roll.
 */
export function Die({ value, rollKey, bust = false }: { value: number | null; rollKey: number; bust?: boolean }) {
  return (
    <span
      key={rollKey}
      role="img"
      aria-label={value === null ? "Die, not rolled yet" : `Die showing ${value}`}
      className={`die ${value !== null ? "die-rolled" : ""} ${bust ? "die-bust" : ""}`}
    >
      {Array.from({ length: 9 }, (_, spot) => (
        <span key={spot} className={value !== null && PIPS[value].includes(spot) ? "die-pip" : ""} />
      ))}
    </span>
  );
}

import type { GameId } from "@/lib/games";

/** Each drawing's own frame, so the narrow ones fill a tile as well as the board does. */
const FRAMES: Record<GameId, string> = {
  sungka: "0 0 160 60",
  "pusoy-dos": "38 0 84 60",
  "hulaan-mo": "28 2 116 56",
};

/** A small drawing for each game, used on the game tiles and the games page. */
export function GameArt({ id, className }: { id: GameId; className?: string }) {
  return (
    <svg viewBox={FRAMES[id]} className={className} aria-hidden="true">
      {id === "sungka" && <SungkaBoard />}
      {id === "pusoy-dos" && <Cards />}
      {id === "hulaan-mo" && <Question />}
    </svg>
  );
}

function SungkaBoard() {
  const houses = [0, 1, 2, 3, 4, 5, 6];
  const shells = [
    [20, 27],
    [24, 33],
    [18, 38],
    [43, 24],
    [80, 46],
    [117, 24],
    [140, 30],
  ];
  return (
    <>
      <rect x="2" y="6" width="156" height="48" rx="24" fill="var(--wood)" />
      <ellipse cx="21" cy="30" rx="10" ry="17" fill="var(--pit)" />
      <ellipse cx="139" cy="30" rx="10" ry="17" fill="var(--pit)" />
      {houses.map((i) => (
        <g key={i} fill="var(--pit)">
          <circle cx={42 + i * 12.7} cy="20" r="5" />
          <circle cx={42 + i * 12.7} cy="40" r="5" />
        </g>
      ))}
      {shells.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="1.9" fill="var(--shell)" />
      ))}
    </>
  );
}

function Cards() {
  return (
    <>
      <g transform="rotate(-12 66 30)">
        <rect x="48" y="4" width="36" height="52" rx="5" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
        <path d="M66 22c-4 5-8 8-8 11a4 4 0 0 0 8 2 4 4 0 0 0 8-2c0-3-4-6-8-11z" fill="var(--red)" />
      </g>
      <g transform="rotate(10 94 30)">
        <rect x="76" y="4" width="36" height="52" rx="5" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
        <text x="94" y="39" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--blue)">
          2
        </text>
      </g>
    </>
  );
}

function Question() {
  return (
    <>
      <path
        d="M44 6h56a12 12 0 0 1 12 12v16a12 12 0 0 1-12 12H66l-12 10V46H44a12 12 0 0 1-12-12V18A12 12 0 0 1 44 6z"
        fill="var(--blue)"
      />
      <text x="72" y="35" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--blue-ink)">
        ?
      </text>
      <rect x="104" y="32" width="36" height="22" rx="9" fill="var(--yellow)" />
      <text x="122" y="47" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--yellow-ink)">
        Oo!
      </text>
    </>
  );
}

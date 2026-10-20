import type { GameId } from "@/lib/games";

/** Each drawing's own frame, so the narrow ones fill a tile as well as the board does. */
const FRAMES: Record<GameId, string> = {
  sungka: "0 0 160 60",
  dama: "46 0 68 60",
  "pusoy-dos": "38 0 84 60",
  "hulaan-mo": "28 2 116 56",
  "four-in-a-row": "40 0 80 60",
  reversi: "50 0 60 60",
  "dots-and-boxes": "50 0 60 60",
  memory: "34 0 92 60",
  "sea-battle": "50 0 60 60",
  morris: "50 0 60 60",
};

/** A small drawing for each game, used on the game tiles and the games page. */
export function GameArt({ id, className }: { id: GameId; className?: string }) {
  return (
    <svg viewBox={FRAMES[id]} className={className} aria-hidden="true">
      {id === "sungka" && <SungkaBoard />}
      {id === "dama" && <Checkers />}
      {id === "pusoy-dos" && <Cards />}
      {id === "hulaan-mo" && <Question />}
      {id === "four-in-a-row" && <FourGrid />}
      {id === "reversi" && <ReversiCorner />}
      {id === "dots-and-boxes" && <DotsGrid />}
      {id === "memory" && <MemoryCards />}
      {id === "sea-battle" && <SeaGrid />}
      {id === "morris" && <MorrisSquares />}
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

/** A corner of a dama board with a red king. */
function Checkers() {
  const squares = [0, 1, 2, 3].flatMap((row) => [0, 1, 2, 3].map((col) => ({ row, col })));
  const pieces = [
    { row: 0, col: 1, color: "#0038a8" },
    { row: 0, col: 3, color: "#0038a8" },
    { row: 2, col: 1, color: "#ce1126" },
    { row: 3, col: 2, color: "#ce1126", king: true },
  ];
  return (
    <g transform="translate(52 3)">
      <rect width="56" height="56" rx="4" fill="#f3dfb4" stroke="#1b1b1b" strokeWidth="2" />
      {squares
        .filter(({ row, col }) => (row + col) % 2 === 1)
        .map(({ row, col }) => (
          <rect key={`${row}-${col}`} x={col * 14} y={row * 14} width="14" height="14" fill="var(--wood)" />
        ))}
      {pieces.map(({ row, col, color, king }) => (
        <g key={`${row}-${col}`}>
          <circle cx={col * 14 + 7} cy={row * 14 + 7} r="5.2" fill={color} stroke="#1b1b1b" strokeWidth="1.2" />
          {king && <circle cx={col * 14 + 7} cy={row * 14 + 7} r="2.2" fill="#fcd116" />}
        </g>
      ))}
    </g>
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

/** A corner of the upright grid with a few discs dropped in. */
function FourGrid() {
  const discs: Record<string, string> = {
    "3-1": "#ce1126",
    "3-2": "#fcd116",
    "3-3": "#ce1126",
    "2-2": "#ce1126",
    "2-3": "#fcd116",
    "1-3": "#fcd116",
  };
  return (
    <>
      <rect x="44" y="4" width="72" height="52" rx="6" fill="#0038a8" stroke="#1b1b1b" strokeWidth="2" />
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={53 + col * 13.5}
            cy={13 + row * 11.3}
            r="4.6"
            fill={discs[`${row}-${col}`] ?? "#fffaf0"}
            stroke="#1b1b1b"
            strokeWidth={discs[`${row}-${col}`] ? 1 : 0}
          />
        )),
      )}
    </>
  );
}

/** The middle of a Reversi board, just after the first move. */
function ReversiCorner() {
  const discs: [number, number, string][] = [
    [1, 1, "#fffaf0"],
    [1, 2, "#1b1b1b"],
    [2, 1, "#1b1b1b"],
    [2, 2, "#1b1b1b"],
    [0, 2, "#1b1b1b"],
  ];
  return (
    <g transform="translate(54 4)">
      <rect width="52" height="52" rx="5" fill="#1e7a46" stroke="#1b1b1b" strokeWidth="2" />
      {[13, 26, 39].map((at) => (
        <g key={at} stroke="#0f4a2a" strokeWidth="1.2">
          <line x1={at} y1="1" x2={at} y2="51" />
          <line x1="1" y1={at} x2="51" y2={at} />
        </g>
      ))}
      {discs.map(([row, col, fill]) => (
        <circle
          key={`${row}-${col}`}
          cx={col * 13 + 6.5}
          cy={row * 13 + 6.5}
          r="4.8"
          fill={fill}
          stroke="#1b1b1b"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

/** A small Dots and Boxes game with one box each and a few lines drawn. */
function DotsGrid() {
  const at = (i: number) => 9 + i * 14;
  // Lines from one dot to the next, as [column, row, column, row].
  const lines: [number, number, number, number][] = [
    [0, 0, 1, 0],
    [1, 0, 2, 0],
    [0, 1, 1, 1],
    [1, 1, 2, 1],
    [0, 0, 0, 1],
    [1, 0, 1, 1],
    [2, 0, 2, 1],
    [3, 0, 3, 1],
    [0, 2, 1, 2],
    [2, 2, 3, 2],
    [1, 2, 1, 3],
    [2, 3, 3, 3],
  ];
  return (
    <g transform="translate(54 4)">
      <rect width="52" height="52" rx="5" fill="#fffaf0" stroke="#1b1b1b" strokeWidth="2" />
      <rect x={at(0)} y={at(0)} width="14" height="14" fill="#ce1126" opacity="0.75" />
      <rect x={at(1)} y={at(0)} width="14" height="14" fill="#0038a8" opacity="0.75" />
      {lines.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}${y1}${x2}${y2}`}
          x1={at(x1)}
          y1={at(y1)}
          x2={at(x2)}
          y2={at(y2)}
          stroke="#1b1b1b"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3].map((col) => <circle key={`${row}-${col}`} cx={at(col)} cy={at(row)} r="2" fill="#1b1b1b" />),
      )}
    </g>
  );
}

/** One card face down and a matching pair turned up. */
function MemoryCards() {
  const star = "M0-9.5l2.8 6 6.6.8-4.9 4.5 1.3 6.6L0 5.2l-5.8 3.2 1.3-6.6-4.9-4.5 6.6-.8z";
  return (
    <>
      <g transform="rotate(-8 52 30)">
        <rect x="40" y="10" width="26" height="36" rx="4" fill="#0038a8" stroke="#1b1b1b" strokeWidth="2" />
        <rect x="44" y="14" width="18" height="28" rx="2" fill="none" stroke="#fffaf0" strokeWidth="1.5" />
      </g>
      {[80, 108].map((x, i) => (
        <g key={x} transform={`rotate(${i === 0 ? 0 : 8} ${x} 30)`}>
          <rect x={x - 13} y="12" width="26" height="36" rx="4" fill="#fffaf0" stroke="#1b1b1b" strokeWidth="2" />
          <path
            d={star}
            transform={`translate(${x} 30) scale(0.9)`}
            fill="#fcd116"
            stroke="#1b1b1b"
            strokeWidth="1.2"
          />
        </g>
      ))}
    </>
  );
}

/** A corner of the water with a ship, a hit, and a few misses. */
function SeaGrid() {
  const step = 10.4;
  const at = (i: number) => 2 + i * step;
  return (
    <g transform="translate(54 4)">
      <rect width="52" height="52" rx="5" fill="#cfe2f6" stroke="#1b1b1b" strokeWidth="2" />
      {[1, 2, 3, 4].map((i) => (
        <g key={i} stroke="#7fa8d6" strokeWidth="0.8">
          <line x1={at(i)} y1="1" x2={at(i)} y2="51" />
          <line x1="1" y1={at(i)} x2="51" y2={at(i)} />
        </g>
      ))}
      <rect x={at(1)} y={at(1)} width={step * 3} height={step} fill="#6b7280" />
      <circle cx={at(2) + step / 2} cy={at(1) + step / 2} r="3.3" fill="#ce1126" stroke="#1b1b1b" strokeWidth="1" />
      {[
        [0, 3],
        [3, 4],
        [4, 0],
      ].map(([col, row]) => (
        <circle
          key={`${col}-${row}`}
          cx={at(col) + step / 2}
          cy={at(row) + step / 2}
          r="1.4"
          fill="#1b1b1b"
          opacity="0.5"
        />
      ))}
    </g>
  );
}

/** The three squares of a Morris board with a few pieces on it. */
function MorrisSquares() {
  const pieces: [number, number, string][] = [
    [0, 0, "#ce1126"],
    [24, 0, "#ce1126"],
    [48, 0, "#ce1126"],
    [16, 16, "#0038a8"],
    [32, 24, "#0038a8"],
    [0, 48, "#0038a8"],
  ];
  return (
    <g transform="translate(61 11) scale(0.8)">
      <rect x="-6" y="-6" width="60" height="60" rx="6" fill="#e8c58c" stroke="#1b1b1b" strokeWidth="2.5" />
      <g fill="none" stroke="#5a3314" strokeWidth="1.6">
        <rect width="48" height="48" />
        <rect x="8" y="8" width="32" height="32" />
        <rect x="16" y="16" width="16" height="16" />
        <path d="M24 0V16M24 32V48M0 24H16M32 24H48" />
      </g>
      {pieces.map(([x, y, fill]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.6" fill={fill} stroke="#1b1b1b" strokeWidth="1.2" />
      ))}
    </g>
  );
}

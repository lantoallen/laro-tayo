import { HIDDEN, isFaceUp, type MemoryMove, type MemoryState } from "@laro/games/memory";
import type { BoardProps } from "@/components/board-game/types";
import "./memory.css";

const SHAPES = ["circle", "square", "triangle", "star", "heart"] as const;
const FACE_COLORS = [
  ["red", "#ce1126"],
  ["blue", "#0038a8"],
  ["yellow", "#fcd116"],
] as const;
const OWNER_CLASSES = ["mm-red", "mm-blue"];
const HEART = "M12 20.5c-1-.9-8.5-6.6-8.5-11.4A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.5 2.4c0 4.8-7.5 10.5-8.5 11.4z";

const faceName = (face: number) =>
  `${FACE_COLORS[Math.floor(face / SHAPES.length)][0]} ${SHAPES[face % SHAPES.length]}`;

/** Fifteen faces: five shapes in three colors. */
function Face({ face }: { face: number }) {
  const shape = SHAPES[face % SHAPES.length];
  const fill = FACE_COLORS[Math.floor(face / SHAPES.length)][1];
  return (
    <svg viewBox="0 0 24 24" className="mm-shape" aria-hidden="true">
      <g fill={fill} stroke="#1b1b1b" strokeWidth="1.4" strokeLinejoin="round">
        {shape === "circle" && <circle cx="12" cy="12" r="8" />}
        {shape === "square" && <rect x="4.5" y="4.5" width="15" height="15" rx="2" />}
        {shape === "triangle" && <path d="M12 3.5 21 19.5H3z" />}
        {shape === "star" && <path d="M12 2.5l2.8 6 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.8 3.2 1.3-6.6L2.6 9.3l6.6-.8z" />}
        {shape === "heart" && <path d={HEART} />}
      </g>
    </svg>
  );
}

export function MemoryBoard({ state, onMove }: BoardProps<MemoryState, MemoryMove>) {
  return (
    <div className="mm-board">
      {state.faces.map((face, card) => {
        const up = isFaceUp(state, card) && face !== HIDDEN;
        const owner = state.owner[card];
        const tappable = onMove !== undefined && owner === null && !state.flipped.includes(card);
        const className = [
          "mm-card",
          up ? "mm-up" : "mm-down",
          owner !== null && `mm-taken ${OWNER_CLASSES[owner]}`,
          state.missed.includes(card) && "mm-missed",
        ]
          .filter(Boolean)
          .join(" ");
        const label = `Card ${card + 1}: ${up ? faceName(face) : "face down"}${owner !== null ? ", taken" : ""}`;
        // A new key when the card turns over, so the flip plays.
        const contents = (
          <span key={up ? "up" : "down"} className="mm-side">
            {up && <Face face={face} />}
          </span>
        );

        if (!tappable) {
          return (
            <div key={card} role="img" aria-label={label} className={className}>
              {contents}
            </div>
          );
        }
        return (
          <button key={card} type="button" aria-label={label} onClick={() => onMove(card)} className={className}>
            {contents}
          </button>
        );
      })}
    </div>
  );
}

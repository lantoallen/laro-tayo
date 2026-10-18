import type { CSSProperties } from "react";
import { BOARD_SIZE, isStore, ownerOf } from "@laro/games/sungka";
import "./board.css";

interface BoardProps {
  board: readonly number[];
  /** Names for seat 0 (bottom) and seat 1 (top). */
  names: [string, string];
  /** Houses the current player may tap. */
  playable: readonly number[];
  onPlay: (house: number) => void;
  /** The slot the last shell went into. */
  active?: number | null;
  /** Shells still being sown. */
  hand?: number;
  captured?: readonly number[];
  /** Extra classes for the board, such as a size modifier. */
  className?: string;
}

/** Grid positions for each slot, for the tall (phone) and long (wide screen) layouts. */
function slotPosition(slot: number): CSSProperties {
  let position: Record<string, string>;
  if (slot === 7) position = { "--hc": "1", "--hr": "1 / span 2", "--vc": "1 / span 2", "--vr": "9" };
  else if (slot === 15) position = { "--hc": "9", "--hr": "1 / span 2", "--vc": "1 / span 2", "--vr": "1" };
  else if (slot < 7) position = { "--hc": `${8 - slot}`, "--hr": "2", "--vc": "2", "--vr": `${2 + slot}` };
  else position = { "--hc": `${2 + slot - 8}`, "--hr": "1", "--vc": "1", "--vr": `${8 - (slot - 8)}` };
  return position as CSSProperties;
}

interface Spot {
  x: number;
  y: number;
  angle: number;
}

/**
 * Shell positions inside a unit circle, using sunflower spacing so new shells fill
 * outward without piling up. CSS stretches them to fit each pit's shape.
 */
function spots(count: number): Spot[] {
  return Array.from({ length: count }, (_, n) => {
    const r = Math.sqrt((n + 0.5) / count);
    const a = n * 2.39996;
    return {
      x: Number((r * Math.cos(a)).toFixed(3)),
      y: Number((r * Math.sin(a)).toFixed(3)),
      angle: (n * 47) % 180,
    };
  });
}

const HOUSE_SPOTS = spots(16);
const STORE_SPOTS = spots(40);

function Shells({ count, store }: { count: number; store: boolean }) {
  const shown = (store ? STORE_SPOTS : HOUSE_SPOTS).slice(0, count);
  return shown.map(({ x, y, angle }) => (
    <span
      key={`${x},${y}`}
      className="sk-shell"
      style={{ "--x": x, "--y": y, "--a": `${angle}deg` } as CSSProperties}
      aria-hidden="true"
    />
  ));
}

export function Board({
  board,
  names,
  playable,
  onPlay,
  active = null,
  hand = 0,
  captured = [],
  className,
}: BoardProps) {
  return (
    <div className={className ? `sk-board ${className}` : "sk-board"}>
      {Array.from({ length: BOARD_SIZE }, (_, slot) => {
        const store = isStore(slot);
        const owner = names[ownerOf(slot)];
        const count = board[slot];
        const canPlay = playable.includes(slot);
        const className = [
          "sk-slot",
          store && "sk-store",
          `sk-side-${ownerOf(slot)}`,
          canPlay && "sk-playable",
          active === slot && "sk-active",
          captured.includes(slot) && "sk-captured",
        ]
          .filter(Boolean)
          .join(" ");
        const label = `${owner}, ${store ? "ulo" : `bahay ${(slot % 8) + 1}`}: ${count} sigay`;

        const contents = (
          <>
            <Shells count={count} store={store} />
            <span className="sk-count">{count}</span>
            {active === slot && hand > 0 && <span className="sk-hand">{hand}</span>}
          </>
        );

        if (store) {
          return (
            <div key={slot} role="img" className={className} style={slotPosition(slot)} aria-label={label}>
              {contents}
            </div>
          );
        }
        return (
          <button
            key={slot}
            type="button"
            className={className}
            style={slotPosition(slot)}
            disabled={!canPlay}
            onClick={() => onPlay(slot)}
            aria-label={label}
          >
            {contents}
          </button>
        );
      })}
    </div>
  );
}

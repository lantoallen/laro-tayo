import type { CSSProperties } from "react";
import { boardFor, legalMoves, type TilesMove, type TilesState } from "@laro/games/sinking-tiles";
import type { BoardProps } from "@/components/board-game/types";
import { FOUR_SWATCHES } from "@/components/game/settings";
import "./tiles.css";

/** Centre to corner of a tile, in SVG units. */
const SIZE = 10;
/** Tiles are drawn a little smaller than their space, so water shows between them. */
const TILE = SIZE * 0.9;
/** How far a tile's side shows below its top. */
const DEPTH = 2.4;
const ROOT3 = Math.sqrt(3);

/** The middle of a flat-topped tile. */
function centre(radius: number, tile: number) {
  const { q, r } = boardFor(radius).hexes[tile];
  return { x: SIZE * 1.5 * q, y: SIZE * ROOT3 * (r + q / 2) };
}

const HEX_POINTS = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i;
  return `${(TILE * Math.cos(angle)).toFixed(2)},${(TILE * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

/** Cracks drawn from the middle of a tile, turned a different way on each tile so they don't all match. */
const CRACK = "M-1.5 -4 L0 -0.6 L-1.2 2.4 M0 -0.6 L3.4 0.8 L5 -0.6";
const MORE_CRACKS = "M-6 2 L-3.4 1.2 L-1.2 2.4 L0.6 6 M3.4 0.8 L4.4 4.4 M-1.5 -4 L-4 -6";
const turnFor = (tile: number) => (tile * 137) % 360;

/** The space the board takes up, with room for the sides of the bottom tiles. */
function frame(radius: number) {
  const halfWidth = SIZE * (1.5 * radius + 1) + 4;
  const halfHeight = SIZE * ROOT3 * (radius + 0.5) + 4;
  return { x: -halfWidth, y: -halfHeight, width: 2 * halfWidth, height: 2 * halfHeight + DEPTH };
}

/** Which way a step from one tile to the next goes on screen, like "up and left". */
function direction(radius: number, from: number, to: number): string {
  const a = boardFor(radius).hexes[from];
  const b = boardFor(radius).hexes[to];
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  if (dq === 0) return dr < 0 ? "up" : "down";
  const side = dq > 0 ? "right" : "left";
  // Sideways steps go half a tile up or down as well.
  const down = dq > 0 ? dr === 0 : dr > 0;
  return `${down ? "down" : "up"} and ${side}`;
}

/** A tile floating on the water: its side, then its top, with cracks once it's been stepped on. */
function Tile({
  x,
  y,
  steps,
  tile,
  sinking = false,
}: {
  x: number;
  y: number;
  steps: number;
  tile: number;
  sinking?: boolean;
}) {
  // The animation goes on the inner group, so it doesn't replace the outer one's position.
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={sinking ? "st-sinking" : undefined}>
        <polygon points={HEX_POINTS} transform={`translate(0 ${DEPTH})`} className="st-side" />
        <polygon points={HEX_POINTS} className={steps >= 2 ? "st-top st-weak" : "st-top"} />
        {steps >= 1 && (
          <g transform={`rotate(${turnFor(tile)})`} className="st-crack">
            <path d={CRACK} />
            {steps >= 2 && <path d={MORE_CRACKS} />}
          </g>
        )}
      </g>
    </g>
  );
}

export function TilesBoard({ state, onMove }: BoardProps<TilesState, TilesMove>) {
  const { radius, tiles, at, last, turn } = state;
  const box = frame(radius);
  const targets = onMove && turn !== null ? legalMoves(state, turn) : [];
  // Tiles that sank on the last move, to show them going under.
  const sinking = last ? [...(last.sank ? [last.from] : []), ...last.fell.map((fall) => fall.tile)] : [];
  const percent = (value: number, start: number, length: number) => `${((value - start) / length) * 100}%`;

  return (
    <div className="st-board" style={{ aspectRatio: `${box.width} / ${box.height}` } as CSSProperties}>
      <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} aria-hidden="true">
        <rect x={box.x} y={box.y} width={box.width} height={box.height} className="st-water" />
        <g className="st-waves">
          {Array.from({ length: 5 }, (_, i) => {
            const y = box.y + ((i + 0.6) * box.height) / 5;
            return (
              <path key={i} d={`M${box.x + 6} ${y} q 6 -3 12 0 t 12 0 M${-box.x - 30} ${y + 9} q 6 -3 12 0 t 12 0`} />
            );
          })}
        </g>

        {sinking.map((tile) => {
          const { x, y } = centre(radius, tile);
          return (
            <g key={`sink-${tile}-${state.turns}`}>
              <circle cx={x} cy={y} r={TILE * 0.8} className="st-ripple" />
              <Tile x={x} y={y} steps={2} tile={tile} sinking />
            </g>
          );
        })}

        {tiles.map((steps, tile) => {
          if (steps === null) return null;
          const { x, y } = centre(radius, tile);
          return <Tile key={tile} x={x} y={y} steps={steps} tile={tile} />;
        })}

        {targets.map((tile) => {
          const { x, y } = centre(radius, tile);
          return <polygon key={tile} points={HEX_POINTS} transform={`translate(${x} ${y})`} className="st-target" />;
        })}

        {last?.fell.map(({ seat, tile }) => {
          const { x, y } = centre(radius, tile);
          return (
            <g key={`fell-${seat}-${state.turns}`} transform={`translate(${x} ${y - 2})`}>
              <circle r={SIZE * 0.46} fill={FOUR_SWATCHES[seat]} className="st-piece st-falling" />
            </g>
          );
        })}

        {at.map((tile, seat) => {
          if (tile === null) return null;
          const { x, y } = centre(radius, tile);
          return (
            <g key={seat} className="st-mover" style={{ transform: `translate(${x}px, ${y - 2}px)` }}>
              {turn === seat && <circle r={SIZE * 0.66} className="st-turn" style={{ stroke: FOUR_SWATCHES[seat] }} />}
              <ellipse cy={3.4} rx={SIZE * 0.4} ry={SIZE * 0.14} className="st-shadow" />
              <circle r={SIZE * 0.46} fill={FOUR_SWATCHES[seat]} className="st-piece" />
              <circle cx={-1.5} cy={-1.6} r={1.3} className="st-shine" />
            </g>
          );
        })}
      </svg>

      {targets.map((tile) => {
        const { x, y } = centre(radius, tile);
        return (
          <button
            key={tile}
            type="button"
            aria-label={`Step ${direction(radius, at[turn!]!, tile)}${tiles[tile] === 1 ? ", onto a cracked tile" : ""}`}
            onClick={() => onMove!(tile)}
            className="st-hit"
            style={{
              left: percent(x, box.x, box.width),
              top: percent(y, box.y, box.height),
              width: `${((SIZE * 1.8) / box.width) * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
}

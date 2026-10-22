import type { CSSProperties } from "react";
import {
  BOXES,
  DOTS,
  HORIZONTAL_LINES,
  LINES,
  SIZE,
  isHorizontal,
  type DotsMove,
  type DotsState,
} from "@laro/games/dots-and-boxes";
import type { BoardProps } from "@/components/board-game/types";
import "./dots.css";

const COLORS = ["red", "blue", "yellow", "green"] as const;

/** Space around the dots, and between them, as a percentage of the board's width. */
const PAD = 5;
const STEP = (100 - 2 * PAD) / SIZE;

/** Where a line starts, as percentages, and which way it runs. */
function lineAt(line: number) {
  const horizontal = isHorizontal(line);
  const index = horizontal ? line : line - HORIZONTAL_LINES;
  const across = horizontal ? SIZE : DOTS;
  const row = Math.floor(index / across);
  const col = index % across;
  return { horizontal, row, col, x: PAD + col * STEP, y: PAD + row * STEP };
}

function lineLabel(line: number): string {
  const { horizontal, row, col } = lineAt(line);
  if (horizontal) return row < SIZE ? `Top of row ${row + 1}, box ${col + 1}` : `Bottom of row ${SIZE}, box ${col + 1}`;
  return col < SIZE ? `Left of row ${row + 1}, box ${col + 1}` : `Right of row ${row + 1}, box ${SIZE}`;
}

/**
 * The tap area around a line. It stops short of the dots so a tap near a
 * corner doesn't land on the wrong line, and the line itself is drawn inside it.
 */
function hitArea(line: number): CSSProperties {
  const { horizontal, x, y } = lineAt(line);
  return horizontal
    ? { left: `${x + STEP * 0.12}%`, top: `${y - STEP * 0.25}%`, width: `${STEP * 0.76}%`, height: `${STEP * 0.5}%` }
    : { left: `${x - STEP * 0.25}%`, top: `${y + STEP * 0.12}%`, width: `${STEP * 0.5}%`, height: `${STEP * 0.76}%` };
}

export function DotsBoard({ state, onMove }: BoardProps<DotsState, DotsMove>) {
  const last = state.last;
  return (
    <div className="db-board">
      {Array.from({ length: BOXES }, (_, box) => {
        const owner = state.boxes[box];
        if (owner === null) return null;
        const row = Math.floor(box / SIZE);
        const col = box % SIZE;
        return (
          <div
            key={box}
            role="img"
            aria-label={`Row ${row + 1}, box ${col + 1}: ${COLORS[owner]}`}
            className={`db-box db-${COLORS[owner]} ${last?.boxes.includes(box) ? "db-new" : ""}`}
            style={{ left: `${PAD + col * STEP}%`, top: `${PAD + row * STEP}%`, width: `${STEP}%`, height: `${STEP}%` }}
          />
        );
      })}

      {Array.from({ length: LINES }, (_, line) => {
        const drawer = state.lines[line];
        const direction = lineAt(line).horizontal ? "db-h" : "db-v";
        const isLast = last?.line === line;
        const lastClass = isLast ? `db-last db-by-${COLORS[last.seat]}` : "";
        const bar = <span className={`db-bar ${drawer === null ? "db-open" : "db-drawn"} ${lastClass}`} />;
        if (drawer === null && onMove) {
          return (
            <button
              key={line}
              type="button"
              aria-label={lineLabel(line)}
              onClick={() => onMove(line)}
              className={`db-hit ${direction}`}
              style={hitArea(line)}
            >
              {bar}
            </button>
          );
        }
        return (
          <span key={line} aria-hidden="true" className={`db-hit ${direction}`} style={hitArea(line)}>
            {bar}
          </span>
        );
      })}

      {Array.from({ length: DOTS * DOTS }, (_, dot) => (
        <span
          key={dot}
          aria-hidden="true"
          className="db-dot"
          style={{ left: `${PAD + (dot % DOTS) * STEP}%`, top: `${PAD + Math.floor(dot / DOTS) * STEP}%` }}
        />
      ))}
    </div>
  );
}

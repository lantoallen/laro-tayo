import type { CSSProperties } from "react";
import type { TicTacToeMove, TicTacToeState } from "@laro/games/tic-tac-toe";
import type { BoardProps } from "@/components/board-game/types";
import "./tic-tac-toe.css";

const MARKS = ["X", "O"] as const;

/** A stroke's length, which its draw-in animation runs along. */
const length = (value: number) => ({ "--len": value }) as CSSProperties;

/** An X or an O, drawn as pen strokes so it can draw itself in. */
function Mark({ seat }: { seat: number }) {
  return (
    <svg viewBox="0 0 40 40" className={`ttt-mark ${seat === 0 ? "ttt-x" : "ttt-o"}`} aria-hidden="true">
      {seat === 0 ? (
        <>
          <path d="M10 10 30 30" style={length(29)} />
          <path d="M30 10 10 30" style={length(29)} className="ttt-second" />
        </>
      ) : (
        <circle cx="20" cy="20" r="11" style={length(70)} />
      )}
    </svg>
  );
}

/** Where the line through a winning three starts and ends, in the board's 0 to 3 grid. */
function strike(line: readonly number[]) {
  const at = (cell: number) => ({ x: (cell % 3) + 0.5, y: Math.floor(cell / 3) + 0.5 });
  const [a, c] = [at(line[0]), at(line[2])];
  // Run the line a little past the outer cells.
  const dx = (c.x - a.x) * 0.18;
  const dy = (c.y - a.y) * 0.18;
  return { x1: a.x - dx, y1: a.y - dy, x2: c.x + dx, y2: c.y + dy };
}

export function TicTacToeBoard({ state, onMove }: BoardProps<TicTacToeState, TicTacToeMove>) {
  return (
    <div className="ttt-board">
      {state.board.map((mark, cell) => {
        const where = `Row ${Math.floor(cell / 3) + 1}, column ${(cell % 3) + 1}`;
        const label = `${where}: ${mark === null ? "empty" : MARKS[mark]}`;
        const className = `ttt-cell ${state.line.includes(cell) ? "ttt-win" : ""}`;
        if (mark === null && onMove) {
          return (
            <button key={cell} type="button" aria-label={label} onClick={() => onMove(cell)} className={className} />
          );
        }
        return (
          <div key={cell} role="img" aria-label={label} className={className}>
            {mark !== null && <Mark seat={mark} />}
          </div>
        );
      })}
      {state.line.length > 0 && (
        <svg viewBox="0 0 3 3" className="ttt-strike" aria-hidden="true">
          <line {...strike(state.line)} style={length(4.5)} />
        </svg>
      )}
    </div>
  );
}

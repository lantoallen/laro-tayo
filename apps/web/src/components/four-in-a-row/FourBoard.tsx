import type { CSSProperties } from "react";
import { COLUMNS, ROWS, colOf, landingCell, rowOf, type FourMove, type FourState } from "@laro/games/four-in-a-row";
import type { BoardProps } from "@/components/board-game/types";
import "./four.css";

const COLORS = ["red", "yellow"] as const;

/** The upright grid. Each column is one big button, since that's all a move is. */
export function FourBoard({ state, onMove }: BoardProps<FourState, FourMove>) {
  return (
    <div className="c4-board">
      <div className="c4-grid">
        {state.board.map((disc, cell) => {
          const where = `Column ${colOf(cell) + 1}, row ${ROWS - rowOf(cell)} from the bottom`;
          const label = `${where}: ${disc === null ? "empty" : COLORS[disc]}`;
          return (
            <div
              key={cell}
              role="img"
              aria-label={label}
              className={`c4-hole ${state.line.includes(cell) ? "c4-win" : ""}`}
            >
              {disc !== null && (
                <span
                  className={`c4-disc c4-${COLORS[disc]} ${cell === state.last ? "c4-new" : ""}`}
                  // How many rows the newest disc falls from the top.
                  style={{ "--fall": rowOf(cell) + 1 } as CSSProperties}
                />
              )}
            </div>
          );
        })}
      </div>
      {onMove && (
        <div className="c4-columns">
          {Array.from({ length: COLUMNS }, (_, column) => (
            <button
              key={column}
              type="button"
              disabled={landingCell(state.board, column) === null}
              onClick={() => onMove(column)}
              aria-label={`Drop a disc in column ${column + 1}`}
              className="c4-column"
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { colOf, movesFor, rowOf, type ReversiMove, type ReversiState } from "@laro/games/reversi";
import type { BoardProps } from "@/components/board-game/types";
import "./reversi.css";

const FILES = "abcdefgh";
const COLORS = ["black", "white"] as const;

/** A square's name the way Reversi players write it: a1 is the top left corner. */
export function squareName(square: number): string {
  return `${FILES[colOf(square)]}${rowOf(square) + 1}`;
}

export function ReversiBoard({ state, onMove }: BoardProps<ReversiState, ReversiMove>) {
  const targets = onMove && state.turn !== null ? movesFor(state.board, state.turn) : [];
  const flipped = state.last?.flipped ?? [];

  return (
    <div className="rv-board">
      {state.board.map((disc, square) => {
        const target = targets.includes(square);
        const placed = state.last?.square === square;
        const label = `${squareName(square)}${disc === null ? "" : `, ${COLORS[disc]}`}${target ? ", play here" : ""}`;
        const className = `rv-square ${placed ? "rv-last" : ""}`;
        const contents =
          disc !== null ? (
            // A new key when a disc changes color, so the flip plays again.
            <span
              key={disc}
              className={`rv-disc rv-${COLORS[disc]} ${placed ? "rv-new" : flipped.includes(square) ? "rv-flip" : ""}`}
            />
          ) : (
            target && <span className="rv-hint" />
          );

        if (!target || !onMove) {
          return (
            <div key={square} className={className} role="img" aria-label={label}>
              {contents}
            </div>
          );
        }
        return (
          <button key={square} type="button" className={className} onClick={() => onMove(square)} aria-label={label}>
            {contents}
          </button>
        );
      })}
    </div>
  );
}

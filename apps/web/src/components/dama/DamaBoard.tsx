import type { Seat } from "@laro/games";
import { SQUARES, colOf, isDark, isKing, ownerOf, rowOf, type Piece } from "@laro/games/dama";
import "./dama-board.css";

interface DamaBoardProps {
  board: readonly Piece[];
  /** The seat drawn at the bottom. */
  perspective?: Seat;
  /** Pieces that can start a move right now. */
  movable?: readonly number[];
  /** Squares the selected piece can land on next. */
  targets?: readonly number[];
  /** The selected piece, then any squares already picked for a multi-jump. */
  path?: readonly number[];
  /** Pieces about to be captured in the move being shown. */
  captured?: readonly number[];
  /** Where the last move started and ended. */
  last?: readonly number[];
  onTap?: (square: number) => void;
}

const FILES = "abcdefgh";

/** A square's name as seen from the red side, like chess: a1 is the bottom left corner. */
export function squareName(square: number): string {
  return `${FILES[colOf(square)]}${8 - rowOf(square)}`;
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="dm-star" aria-hidden="true">
      <path d="M12 2.5l2.8 6 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.8 3.2 1.3-6.6L2.6 9.3l6.6-.8z" />
    </svg>
  );
}

export function DamaBoard({
  board,
  perspective = 0,
  movable = [],
  targets = [],
  path = [],
  captured = [],
  last = [],
  onTap,
}: DamaBoardProps) {
  // Turning the board around for the other player reverses the square order.
  const order = Array.from({ length: SQUARES }, (_, i) => (perspective === 0 ? i : SQUARES - 1 - i));

  return (
    <div className="dm-board">
      {order.map((square) => {
        const dark = isDark(square);
        if (!dark) return <div key={square} className="dm-square" aria-hidden="true" />;

        const piece = board[square];
        const owner = ownerOf(piece);
        const isTarget = targets.includes(square);
        const tappable = onTap !== undefined && (movable.includes(square) || isTarget);
        const className = [
          "dm-square dm-dark",
          movable.includes(square) && path.length === 0 && "dm-movable",
          path[0] === square && "dm-selected",
          path.indexOf(square) > 0 && "dm-path",
          isTarget && "dm-target",
          captured.includes(square) && "dm-captured",
          last.includes(square) && "dm-last",
        ]
          .filter(Boolean)
          .join(" ");
        const label =
          squareName(square) +
          (owner === null ? "" : `, ${owner === 0 ? "red" : "blue"} ${isKing(piece) ? "king" : "piece"}`) +
          (isTarget ? ", move here" : "");
        const contents = owner !== null && (
          <span className={`dm-piece ${owner === 0 ? "dm-red" : "dm-blue"}`}>{isKing(piece) && <Star />}</span>
        );

        if (!tappable) {
          return (
            <div key={square} className={className} role="img" aria-label={label}>
              {contents}
            </div>
          );
        }
        return (
          <button key={square} type="button" className={className} onClick={() => onTap(square)} aria-label={label}>
            {contents}
          </button>
        );
      })}
    </div>
  );
}

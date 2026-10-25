"use client";

import { useRef, useState, type PointerEvent } from "react";
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
/** How far a finger has to move before a press on a piece becomes a drag. */
const DRAG_START_PX = 6;
/**
 * A press on a piece is handled when it happens, so the click the browser sends
 * after it is ignored. Some phones send that click a little later, so any click
 * this soon after a press ends is treated as part of it.
 */
const CLICK_AFTER_PRESS_MS = 500;

/** Keeps getting a pointer's moves after it leaves the element. Without that, dragging still works inside it. */
function holdPointer(event: PointerEvent<HTMLElement>) {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // The pointer is already gone.
  }
}

/** The square a pointer event happened on, from the `data-square` on each dark square. */
function squareFrom(target: EventTarget | null): number | null {
  const element = target instanceof Element ? target.closest<HTMLElement>("[data-square]") : null;
  return element ? Number(element.dataset.square) : null;
}

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

  // Dragging a piece works like tapping it and then tapping where it lands, so both can be mixed freely.
  const boardRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ square: number; x: number; y: number; wasPicked: boolean; moved: boolean } | null>(null);
  // When a press on a piece was last handled, so the click that follows it is ignored. 0 for none.
  const pressedAt = useRef(0);
  const [lifted, setLifted] = useState<{ square: number; x: number; y: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const square = squareFrom(event.target);
    if (!onTap || event.button !== 0 || square === null || !movable.includes(square)) return;
    const wasPicked = path[0] === square;
    press.current = { square, x: event.clientX, y: event.clientY, wasPicked, moved: false };
    pressedAt.current = event.timeStamp;
    // Pick the piece up straight away, so the squares it can move to show while it's dragged.
    if (!wasPicked) onTap(square);
    // Follow this pointer wherever it goes until it lets go, so a drag that leaves the board still ends cleanly.
    holdPointer(event);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    const board = boardRef.current;
    if (!current || !board) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_START_PX) return;
    current.moved = true;
    const box = board.getBoundingClientRect();
    setLifted({ square: current.square, x: event.clientX - box.left, y: event.clientY - box.top });
    setOver(squareFrom(document.elementFromPoint(event.clientX, event.clientY)));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    press.current = null;
    setLifted(null);
    setOver(null);
    if (!current || !onTap) return;
    pressedAt.current = event.timeStamp;
    if (current.moved) {
      const drop = squareFrom(document.elementFromPoint(event.clientX, event.clientY));
      if (drop !== null && targets.includes(drop)) onTap(drop);
    } else if (current.wasPicked) {
      // A plain tap on the picked piece puts it back down, as before.
      onTap(current.square);
    }
  }

  function onPointerCancel() {
    press.current = null;
    setLifted(null);
    setOver(null);
  }

  const liftedPiece = lifted === null ? null : board[lifted.square];

  return (
    <div
      ref={boardRef}
      className="dm-board"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {order.map((square) => {
        const dark = isDark(square);
        if (!dark) return <div key={square} className="dm-square" aria-hidden="true" />;

        const piece = board[square];
        const owner = ownerOf(piece);
        const isTarget = targets.includes(square);
        const tappable = onTap !== undefined && (movable.includes(square) || isTarget);
        const className = [
          "dm-square dm-dark",
          onTap && movable.includes(square) && "dm-draggable",
          movable.includes(square) && path.length === 0 && "dm-movable",
          path[0] === square && "dm-selected",
          path.indexOf(square) > 0 && "dm-path",
          isTarget && "dm-target",
          captured.includes(square) && "dm-captured",
          last.includes(square) && "dm-last",
          lifted?.square === square && "dm-lifted",
          isTarget && over === square && "dm-over",
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
            <div key={square} data-square={square} className={className} role="img" aria-label={label}>
              {contents}
            </div>
          );
        }
        return (
          <button
            key={square}
            data-square={square}
            type="button"
            className={className}
            onClick={(event) => {
              if (event.timeStamp - pressedAt.current > CLICK_AFTER_PRESS_MS) onTap(square);
            }}
            aria-label={label}
          >
            {contents}
          </button>
        );
      })}
      {lifted && liftedPiece !== null && ownerOf(liftedPiece) !== null && (
        <span
          className={`dm-piece dm-ghost ${ownerOf(liftedPiece) === 0 ? "dm-red" : "dm-blue"}`}
          style={{ left: lifted.x, top: lifted.y }}
          aria-hidden="true"
        >
          {isKing(liftedPiece) && <Star />}
        </span>
      )}
    </div>
  );
}

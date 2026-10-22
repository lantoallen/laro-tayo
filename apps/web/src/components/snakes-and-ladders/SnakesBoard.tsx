"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { LAST_SQUARE, jumpFrom, nextMove, type SnakesMove, type SnakesState } from "@laro/games/snakes-and-ladders";
import { Die } from "@/components/board-game/Die";
import type { BoardProps } from "@/components/board-game/types";
import { FOUR_SWATCHES } from "@/components/game/settings";
import { centerOf, pointAlong, snakePoints, type Point } from "./geometry";
import { SnakesArt } from "./SnakesArt";
import "./snakes.css";

const COLORS = ["red", "blue", "yellow", "green"] as const;
/** Where pieces sit when they share a square: side by side for two, in a square for more. */
const SPREAD = {
  2: [
    [-0.18, 0],
    [0.18, 0],
  ],
  4: [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ],
} as const;
/** How long a piece takes to climb a ladder or slide down a snake. */
const CLIMB_MS = 900;
const SLIDE_MS = 1100;

/** The squares in the order they're drawn: top row first, left to right. */
const DRAWN = Array.from({ length: 100 }, (_, i) => {
  const rowFromTop = Math.floor(i / 10);
  const col = i % 10;
  const rowFromBottom = 9 - rowFromTop;
  return rowFromBottom * 10 + (rowFromBottom % 2 === 0 ? col : 9 - col) + 1;
});

/** Each row has its own color, checkered with plain squares. */
const ROW_TINTS = ["sl-yellow-row", "sl-green-row", "sl-blue-row", "sl-pink-row"];
function tintOf(square: number) {
  const { x, y } = centerOf(square);
  const row = Math.floor((square - 1) / 10);
  return (Math.floor(x) + Math.floor(y)) % 2 === 1 ? ROW_TINTS[row % ROW_TINTS.length] : "";
}

function Crown() {
  return (
    <svg viewBox="0 0 24 24" className="sl-crown" aria-hidden="true">
      <path d="M3 18 L5 7 L9.5 12 L12 5 L14.5 12 L19 7 L21 18 Z" />
    </svg>
  );
}

const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
const easeIn = (t: number) => t ** 1.7;

/**
 * Moves a piece along the ladder it climbed or the snake it slid down, rather
 * than straight across the board. The piece's `left` and `top` already point
 * at where it ends up; this only draws the way there.
 */
function useJumpAnimation(positions: number[], tokens: { current: (HTMLElement | null)[] }) {
  const before = useRef(positions);
  useLayoutEffect(() => {
    const previous = before.current;
    before.current = positions;
    if (previous.length !== positions.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stops: (() => void)[] = [];
    positions.forEach((square, seat) => {
      const jump = jumpFrom(previous[seat]);
      const token = tokens.current[seat];
      if (!jump || jump.to !== square || !token) return;
      const from = previous[seat];
      const ladder = jump.jump === "ladder";
      const points: Point[] = ladder ? [centerOf(from), centerOf(square)] : snakePoints(from, square);
      const duration = ladder ? CLIMB_MS : SLIDE_MS;
      const end = { left: token.style.left, top: token.style.top };
      let written = "";
      let frame = 0;
      const finish = () => {
        token.classList.remove("sl-riding");
        // Put the piece back where React placed it, unless React has moved it again since.
        if (token.style.left === written) Object.assign(token.style, end);
      };
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        if (t === 1) return finish();
        const p = pointAlong(points, ladder ? easeInOut(t) : easeIn(t));
        token.style.left = `${p.x * 10}%`;
        token.style.top = `${p.y * 10}%`;
        // Read back, since the browser rounds what it stores.
        written = token.style.left;
        frame = requestAnimationFrame(step);
      };
      token.classList.add("sl-riding");
      step(started);
      stops.push(() => {
        cancelAnimationFrame(frame);
        finish();
      });
    });
    return () => stops.forEach((stop) => stop());
  }, [positions, tokens]);
}

export function SnakesBoard({ state, onMove }: BoardProps<SnakesState, SnakesMove>) {
  const move = nextMove(state);
  const mover = state.turn;
  const moverAt = mover === null ? 0 : state.positions[mover];
  const left = state.moving?.left ?? 0;
  // The squares the moving piece still has to cross. The first is the one to tap next.
  const path = move === "step" ? Array.from({ length: left }, (_, i) => moverAt + 1 + i) : [];
  const target = path[0] ?? null;
  const waitingOn = move === "jump" ? moverAt : null;
  const jump = waitingOn === null ? null : jumpFrom(waitingOn);

  const tokens = useRef<(HTMLElement | null)[]>([]);
  useJumpAnimation(state.positions, tokens);

  // Keep keyboard focus on the board as the square to tap moves along.
  const focusNext = useRef(false);
  const targetButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    targetButton.current?.focus({ preventScroll: true });
  }, [target, waitingOn]);
  const canAct = onMove !== undefined && move !== null;
  const act = () => {
    focusNext.current = true;
    if (onMove && move) onMove(move);
  };

  const seats = state.positions.map((_, seat) => seat);
  /** How far to shift a piece so pieces on the same square don't hide each other. */
  const nudge = (seat: number) => {
    const together = seats.filter((other) => state.positions[other] === state.positions[seat]);
    if (together.length === 1) return [0, 0];
    const spots = together.length === 2 ? SPREAD[2] : SPREAD[4];
    return spots[together.indexOf(seat)];
  };

  const squareLabel = (square: number) => {
    if (square === target) return `Move to square ${square}. ${left === 1 ? "Last step" : `${left} to go`}.`;
    if (jump?.jump === "ladder") return `Climb the ladder to ${jump.to}`;
    return `Slide down the snake to ${jump?.to}`;
  };

  return (
    <div className="sl-wrap">
      <div className="sl-board" style={{ "--mover": FOUR_SWATCHES[mover ?? 0] } as CSSProperties}>
        {DRAWN.map((square) => {
          const className = [
            "sl-square",
            tintOf(square),
            square === LAST_SQUARE && "sl-goal",
            path.includes(square) && "sl-path",
            square === path.at(-1) && "sl-path-end",
            square === target && "sl-target",
            square === waitingOn && "sl-target",
          ]
            .filter(Boolean)
            .join(" ");
          const inside = (
            <>
              <span className="sl-number">{square}</span>
              {square === LAST_SQUARE && <Crown />}
            </>
          );
          if (canAct && (square === target || square === waitingOn)) {
            return (
              <button
                key={square}
                ref={targetButton}
                type="button"
                onClick={act}
                aria-label={squareLabel(square)}
                className={className}
              >
                {inside}
              </button>
            );
          }
          return (
            <div key={square} className={className}>
              {inside}
            </div>
          );
        })}
        <SnakesArt active={waitingOn} onFollow={canAct ? act : undefined} />
        {seats.map((seat) => {
          const square = state.positions[seat];
          if (square === 0) return null;
          const { x, y } = centerOf(square);
          const [dx, dy] = nudge(seat);
          // Tapping your own piece moves it too, the way you'd pick it up on a real board.
          const tappable = seat === mover && canAct && move !== "roll";
          return (
            <span
              key={seat}
              ref={(element) => {
                tokens.current[seat] = element;
              }}
              role="img"
              aria-label={`${COLORS[seat]} on square ${square}`}
              onClick={tappable ? act : undefined}
              className={`sl-token ${seat === mover ? "sl-turn" : ""} ${tappable ? "sl-tappable" : ""}`}
              style={{ left: `${(x + dx) * 10}%`, top: `${(y + dy) * 10}%` }}
            >
              {/* A new piece each square, so it hops. */}
              <span key={square} className={`sl-piece sl-${COLORS[seat]}`} />
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-h-8 items-center gap-2 text-sm text-muted">
          {seats.some((seat) => state.positions[seat] === 0) && (
            <>
              Start:
              {seats.map(
                (seat) =>
                  state.positions[seat] === 0 && (
                    <span
                      key={seat}
                      role="img"
                      aria-label={`${COLORS[seat]} at the start`}
                      className={`sl-piece sl-${COLORS[seat]} sl-waiting ${seat === mover ? "sl-turn" : ""}`}
                    />
                  ),
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {move === "step" && (
            <p className="sl-to-go">
              <span key={left} className="stat-pop">
                {left}
              </span>{" "}
              to go
            </p>
          )}
          <Die
            value={state.moving?.roll ?? state.last?.roll ?? null}
            rollKey={state.rolls}
            onRoll={canAct && move === "roll" ? act : undefined}
          />
          {canAct && move === "roll" && (
            <button type="button" onClick={act} className="btn btn-primary">
              Roll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

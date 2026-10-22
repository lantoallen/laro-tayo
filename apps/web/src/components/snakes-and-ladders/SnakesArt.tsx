import { LADDERS, SNAKES } from "@laro/games/snakes-and-ladders";
import { centerOf, snakePoints, type Point } from "./geometry";

const OUTLINE = "#1b1b1b";

/** Each snake gets its own colors, and either bands or spots. */
const LOOKS = [
  { body: "#2f9e44", pattern: "#fcd116", kind: "bands" },
  { body: "#7048e8", pattern: "#e5dbff", kind: "spots" },
  { body: "#f76707", pattern: "#3b2314", kind: "bands" },
  { body: "#1971c2", pattern: "#a5d8ff", kind: "spots" },
  { body: "#e03131", pattern: "#ffd43b", kind: "bands" },
  { body: "#0c8599", pattern: "#c3fae8", kind: "spots" },
  { body: "#c2255c", pattern: "#fff0f6", kind: "bands" },
  { body: "#5c940d", pattern: "#d8f5a2", kind: "spots" },
] as const;

type Look = (typeof LOOKS)[number];

/**
 * Worked out once, since the board never changes. Drawn from the top of the
 * board down, so a lower snake's head lies on top of a longer snake's body.
 */
const SNAKE_ART = Object.entries(SNAKES)
  .map(([head, tail], i) => ({
    head: Number(head),
    points: snakePoints(Number(head), tail),
    look: LOOKS[i % LOOKS.length],
  }))
  .reverse();

const at = (p: Point, d: Point, along: number, side = 0, q: Point = { x: -d.y, y: d.x }) => ({
  x: p.x + d.x * along + q.x * side,
  y: p.y + d.y * along + q.y * side,
});
const list = (points: readonly Point[]) => points.map((p) => `${p.x},${p.y}`).join(" ");

function Snake({
  points,
  look,
  active,
  onFollow,
}: {
  points: Point[];
  look: Look;
  active: boolean;
  onFollow?: () => void;
}) {
  const last = points.length - 1;
  // Thick behind the head, thin at the tail.
  const width = (i: number) => 0.06 + 0.22 * (1 - i / last) ** 0.85;
  const segments = points.slice(1).map((b, i) => ({ a: points[i], b, w: width(i) }));
  const lines = (stroke: string, extra: number, only?: (i: number) => boolean) =>
    segments.map(({ a, b, w }, i) =>
      only && !only(i) ? null : (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={w + extra} />
      ),
    );

  // The head points away from the body.
  const h = points[0];
  const length = Math.hypot(h.x - points[1].x, h.y - points[1].y);
  const d = { x: (h.x - points[1].x) / length, y: (h.y - points[1].y) / length };
  const angle = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const tongue = at(h, d, 0.17);
  const fork = at(h, d, 0.26);
  const [left, right] = [at(fork, d, 0.06, 0.045), at(fork, d, 0.06, -0.045)];

  return (
    <g className={`sl-snake ${onFollow ? "sl-tappable" : ""}`} onClick={onFollow}>
      {active && <polyline points={list(points)} className="sl-glow" />}
      <g transform="translate(0.05 0.07)" opacity="0.2">
        {lines("#000", 0.07)}
      </g>
      {lines(OUTLINE, 0.07)}
      {lines(look.body, 0)}
      {look.kind === "bands"
        ? lines(look.pattern, -0.01, (i) => i % 4 === 2 && i < last - 3)
        : points.map((p, i) =>
            i % 3 === 1 && i < last - 3 ? (
              <circle key={i} cx={p.x} cy={p.y} r={width(i) * 0.28} fill={look.pattern} />
            ) : null,
          )}
      <polyline points={list(points.slice(1, Math.round(last * 0.8)))} className="sl-shine" />
      <path
        d={`M${tongue.x} ${tongue.y}L${fork.x} ${fork.y}L${left.x} ${left.y}M${fork.x} ${fork.y}L${right.x} ${right.y}`}
        className="sl-tongue"
      />
      <ellipse
        cx={h.x + d.x * 0.03}
        cy={h.y + d.y * 0.03}
        rx="0.2"
        ry="0.165"
        transform={`rotate(${angle} ${h.x + d.x * 0.03} ${h.y + d.y * 0.03})`}
        fill={look.body}
        stroke={OUTLINE}
        strokeWidth="0.045"
      />
      {[1, -1].map((side) => {
        const eye = at(h, d, 0.06, 0.085 * side);
        return (
          <g key={side}>
            <circle cx={eye.x} cy={eye.y} r="0.055" fill="#fffaf0" stroke={OUTLINE} strokeWidth="0.018" />
            <circle cx={eye.x + d.x * 0.02} cy={eye.y + d.y * 0.02} r="0.028" fill={OUTLINE} />
          </g>
        );
      })}
    </g>
  );
}

function Ladder({ from, to, active, onFollow }: { from: number; to: number; active: boolean; onFollow?: () => void }) {
  const a = centerOf(from);
  const b = centerOf(to);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const u = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  // Reach a little past both centers, so the ends sit inside their squares.
  const start = at(a, u, -0.12);
  const end = at(b, u, 0.12);
  const rails = [0.19, -0.19].map((side) => [at(start, u, 0, side), at(end, u, 0, side)]);
  const rungs = Array.from({ length: Math.floor((length - 0.1) / 0.4) }, (_, i) => 0.25 + i * 0.4).map((t) => [
    at(start, u, t, 0.19),
    at(start, u, t, -0.19),
  ]);
  const draw = (pairs: Point[][], stroke: string, width: number) =>
    pairs.map(([p, q], i) => <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={stroke} strokeWidth={width} />);

  return (
    <g className={`sl-ladder ${onFollow ? "sl-tappable" : ""}`} onClick={onFollow}>
      {active && <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="sl-glow" />}
      <g transform="translate(0.05 0.07)" opacity="0.2">
        {draw([...rails, ...rungs], "#000", 0.13)}
      </g>
      {draw(rungs, "#4a2a0e", 0.1)}
      {draw(rungs, "#e0aa69", 0.055)}
      {draw(rails, "#4a2a0e", 0.13)}
      {draw(rails, "#b9773a", 0.075)}
    </g>
  );
}

/**
 * The ladders and snakes drawn over the squares. `active` is the square of a
 * ladder's foot or a snake's head that a piece is waiting on, which glows and
 * can be tapped when `onFollow` is given.
 */
export function SnakesArt({ active, onFollow }: { active: number | null; onFollow?: () => void }) {
  return (
    <svg viewBox="0 0 10 10" className="sl-art" aria-hidden="true">
      {Object.entries(LADDERS).map(([from, to]) => {
        const here = Number(from) === active;
        return <Ladder key={from} from={Number(from)} to={to} active={here} onFollow={here ? onFollow : undefined} />;
      })}
      {SNAKE_ART.map(({ head, points, look }) => {
        const here = head === active;
        return <Snake key={head} points={points} look={look} active={here} onFollow={here ? onFollow : undefined} />;
      })}
    </svg>
  );
}

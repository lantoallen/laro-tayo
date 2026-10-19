/** A small drawing of a sungka board for the games page. */
export function SungkaArt({ className }: { className?: string }) {
  const houses = [0, 1, 2, 3, 4, 5, 6];
  const shells = [
    [20, 27],
    [24, 33],
    [18, 38],
    [43, 24],
    [80, 46],
    [117, 24],
    [140, 30],
  ];
  return (
    <svg viewBox="0 0 160 60" className={className} aria-hidden="true">
      <rect x="2" y="6" width="156" height="48" rx="24" fill="var(--wood)" />
      <ellipse cx="21" cy="30" rx="10" ry="17" fill="var(--pit)" />
      <ellipse cx="139" cy="30" rx="10" ry="17" fill="var(--pit)" />
      {houses.map((i) => (
        <g key={i} fill="var(--pit)">
          <circle cx={42 + i * 12.7} cy="20" r="5" />
          <circle cx={42 + i * 12.7} cy="40" r="5" />
        </g>
      ))}
      {shells.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="1.9" fill="var(--shell)" />
      ))}
    </svg>
  );
}

/** The eight-rayed sun from the Philippine flag. */
export function SunMark({ className }: { className?: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0038a8" />
      <g fill="#fcd116">
        {rays.map((angle) => (
          <path key={angle} d="M16 3.5 17.6 9h-3.2z" transform={`rotate(${angle} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="5.5" />
      </g>
    </svg>
  );
}

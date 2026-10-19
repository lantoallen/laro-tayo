/** The Laro Tayo! sign. "large" stacks the words for the start screen. */
export function Logo({ large = false, className = "" }: { large?: boolean; className?: string }) {
  return (
    <span role="img" aria-label="Laro Tayo!" className={`sign ${large ? "sign-large" : ""} ${className}`}>
      <span aria-hidden="true">LARO</span>
      <span aria-hidden="true" className="text-[#ce1126]">
        TAYO!
      </span>
    </span>
  );
}

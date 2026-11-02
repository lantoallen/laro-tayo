/** The Laro Tayo! sign. "large" stacks the words for the start screen. */
export function Logo({ large = false, className = "" }: { large?: boolean; className?: string }) {
  return (
    <span role="img" aria-label="Laro Tayo!" className={`sign ${large ? "sign-large" : ""} ${className}`}>
      <span aria-hidden="true">LARO</span>
      {/* A deeper red than the flag's, so the small sign in the header is easy to read on the yellow. */}
      <span aria-hidden="true" className="text-[#b3101f]">
        TAYO!
      </span>
    </span>
  );
}

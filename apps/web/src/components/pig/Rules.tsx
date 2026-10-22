export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>On your turn, roll the die as many times as you like. Each roll adds to this turn&apos;s points.</li>
        <li>Roll a 1 and you lose this turn&apos;s points, and the turn passes.</li>
        <li>Hold to bank this turn&apos;s points and pass the die.</li>
        <li>The first to 100 points wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        The striped part of your bar is what you&apos;d lose on a 1. A common rule of thumb is to hold at about 20.
      </p>
    </>
  );
}

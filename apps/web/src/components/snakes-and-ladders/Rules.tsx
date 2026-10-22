export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Both players start off the board. Take turns rolling the die and moving that many squares.</li>
        <li>
          Land at the bottom of a ladder and you climb to the top. Land on a snake&apos;s head and you slide down to its
          tail.
        </li>
        <li>The first to land exactly on square 100 wins. A roll that would go past 100 doesn&apos;t move you.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">It&apos;s all luck, so the bot has no levels. Tap Roll on your turn.</p>
    </>
  );
}

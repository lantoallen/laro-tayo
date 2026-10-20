export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>
          Each side has five ships hidden on a 10 by 10 grid: a carrier (5 squares), a battleship (4), a cruiser (3), a
          submarine (3), and a destroyer (2). They&apos;re placed at random, and no two ships touch.
        </li>
        <li>Take turns firing at a square in the other side&apos;s waters. You&apos;ll see a hit or a miss.</li>
        <li>A ship sinks once every one of its squares is hit. Sink the whole fleet to win.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Since ships never touch, the squares around a sunk ship are always empty. Each player sees only their own ships,
        so this is played against the bot or online, not on one shared phone.
      </p>
    </>
  );
}

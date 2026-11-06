export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>There are three piles of sticks. Players take turns.</li>
        <li>On your turn, pick one pile and tap a stick. You take that stick and every stick after it in the pile.</li>
        <li>Whoever takes the very last stick wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Whoever goes first can always win by leaving the piles balanced, so the hard bot never slips when it starts.
        Try to work out what it leaves behind.
      </p>
    </>
  );
}

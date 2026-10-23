// Plays a full game of every online game against a running room server. Scripted players pick random legal
// moves with each game's own rules, and games for more than two are also played with a full table. It checks
// that everyone sees the same result, that every update says which version the server runs, and that a
// reaction reaches the whole room.
//
//   node apps/server/scripts/play-every-game.mjs                      # local server on port 8787
//   node apps/server/scripts/play-every-game.mjs https://example.dev  # a deployed server
//
// The rules are TypeScript, so they're bundled with esbuild first. esbuild comes with the dev tools (Vite and
// Wrangler both use it). Needs Node 22 or newer for the built-in WebSocket.

import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const base = process.argv[2] ?? "http://localhost:8787";
const wsBase = base.replace(/^http/, "ws");
const ORIGIN = "https://laro-tayo.vercel.app";

const entry = fileURLToPath(new URL("../../../packages/rooms/src/index.ts", import.meta.url));
const bundle = await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", write: false });
const code = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const { GAMES, ROOM_VERSION, gameFor } = await import(`data:text/javascript;base64,${code}`);

const pick = (list) => list[Math.floor(Math.random() * list.length)];
let failed = false;

async function makeRoom(game, players) {
  const response = await fetch(`${base}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ game, players }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.code;
}

/** One scripted player. Resolves with what it saw once the game is over. */
function player(room, name, { react = false } = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsBase}/rooms/${room}/socket`);
    // `reactedAs` is the seat this player sent its reaction from. Players join all at once, so any seat can be theirs.
    const seen = { versions: new Set(), turns: [], reactions: [], reactedAs: null, moves: 0, result: null };
    let lastSent = -1;
    let reacted = false;
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`${name} timed out`));
    }, 180_000);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "hello", playerId: `${name}-${Date.now()}`, name }));
    });
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "reaction") return seen.reactions.push(message);
      if (message.type === "error") {
        clearTimeout(timer);
        ws.close();
        return reject(new Error(`${name} was told: ${message.message}`));
      }
      const { room: snapshot } = message;
      seen.versions.add(message.version);
      if (snapshot.phase === "over") {
        seen.result = snapshot.result;
        clearTimeout(timer);
        ws.close();
        return resolve(seen);
      }
      if (snapshot.phase !== "playing") return;
      if (react && !reacted) {
        reacted = true;
        seen.reactedAs = snapshot.you;
        ws.send(JSON.stringify({ type: "react", reaction: "gg" }));
      }
      const game = gameFor(snapshot.gameId);
      const turn = game.turn(snapshot.view);
      if (seen.turns.at(-1) !== turn) seen.turns.push(turn);
      if (turn !== snapshot.you || lastSent === snapshot.moveCount) return;
      lastSent = snapshot.moveCount;
      seen.moves++;
      ws.send(JSON.stringify({ type: "move", move: pick(game.legalMoves(snapshot.view, snapshot.you)) }));
    });
    ws.addEventListener("error", () => reject(new Error(`${name} lost the connection`)));
  });
}

async function playGame(gameId, players) {
  const room = await makeRoom(gameId, players);
  const seats = Array.from({ length: players }, (_, i) => player(room, `player-${i}`, { react: i === 0 }));
  const seen = await Promise.all(seats);
  const result = JSON.stringify(seen[0].result);
  const problems = [];
  if (!seen.every((s) => JSON.stringify(s.result) === result)) problems.push("players saw different results");
  if (!seen.every((s) => s.versions.size === 1 && s.versions.has(ROOM_VERSION))) {
    problems.push(`expected version ${ROOM_VERSION}, got ${[...seen[0].versions].join(", ")}`);
  }
  const sender = seen[0].reactedAs;
  if (!seen.every((s) => s.reactions.some((r) => r.seat === sender && r.reaction === "gg"))) {
    problems.push("not everyone got the reaction");
  }
  // Turns go around the table in order. A player who gets another turn just keeps it for longer.
  const order = seen[0].turns.filter((turn) => turn !== null);
  if (order.some((turn, i) => i > 0 && turn !== (order[i - 1] + 1) % players)) problems.push("turns went out of order");
  const moves = seen.reduce((sum, s) => sum + s.moves, 0);
  const summary = `${gameId} for ${players} in room ${room}: ${moves} moves, result ${result}`;
  console.log(
    `${problems.length === 0 ? "ok" : "FAIL"} - ${summary}${problems.length ? ` (${problems.join("; ")})` : ""}`,
  );
  if (problems.length > 0) failed = true;
}

for (const gameId of Object.keys(GAMES)) {
  const { minSeats, maxSeats } = gameFor(gameId);
  for (const players of new Set([minSeats, maxSeats])) {
    try {
      await playGame(gameId, players);
    } catch (error) {
      console.log(`FAIL - ${gameId} for ${players}: ${error.message}`);
      failed = true;
    }
  }
}

const tooMany = await fetch(`${base}/rooms`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: ORIGIN },
  body: JSON.stringify({ game: "pig", players: 5 }),
});
console.log(`${tooMany.status === 400 ? "ok" : "FAIL"} - a room for 5 is turned down with ${tooMany.status}`);
if (tooMany.status !== 400) failed = true;

process.exit(failed ? 1 : 0);

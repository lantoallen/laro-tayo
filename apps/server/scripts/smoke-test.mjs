// Plays a full Sungka game against a running room server with two fake players.
//
//   node apps/server/scripts/smoke-test.mjs                      # local server on port 8787
//   node apps/server/scripts/smoke-test.mjs https://example.dev  # a deployed server
//
// Needs Node 22 or newer for the built-in WebSocket.

const base = process.argv[2] ?? "http://localhost:8787";
const wsBase = base.replace(/^http/, "ws");

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`ok - ${message}`);
}

/** A player connection that keeps the latest room snapshot and lets the test wait for changes. */
function connect(code, id, name) {
  const ws = new WebSocket(`${wsBase}/rooms/${code}/socket`);
  const client = { ws, room: null, lastMove: null, errors: [], closeCode: null, waiters: [] };
  ws.addEventListener("open", () => ws.send(JSON.stringify({ type: "hello", playerId: id, name })));
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "room") {
      client.room = message.room;
      client.lastMove = message.lastMove ?? null;
    } else {
      client.errors.push(message.message);
    }
    for (const waiter of client.waiters.splice(0)) waiter();
  });
  ws.addEventListener("close", (event) => {
    client.closeCode = event.code;
    for (const waiter of client.waiters.splice(0)) waiter();
  });
  return client;
}

async function until(client, condition, what) {
  const deadline = Date.now() + 5000;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${what}${client.errors.length ? ` (server said: ${client.errors.at(-1)})` : ""}`);
    }
    await new Promise((resolve) => {
      client.waiters.push(resolve);
      setTimeout(resolve, 200);
    });
  }
}

function legalHouses(board, seat) {
  const first = seat === 0 ? 0 : 8;
  return Array.from({ length: 7 }, (_, i) => first + i).filter((house) => board[house] > 0);
}

const response = await fetch(`${base}/rooms`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ game: "sungka" }),
});
check(response.status === 201, "creates a room");
const { code } = await response.json();
console.log(`  room ${code}`);

const ana = connect(code, "smoke-ana-0001", "Ana");
await until(ana, () => ana.room, "Ana's first snapshot");
check(ana.room.phase === "waiting" && ana.room.you === 0, "first player waits in seat 0");

const ben = connect(code, "smoke-ben-0002", "Ben");
await until(ben, () => ben.room?.phase === "playing", "the game to start");
await until(ana, () => ana.room.phase === "playing", "Ana to see the game start");
check(ben.room.you === 1 && ana.room.seats[1].name === "Ben", "second player takes seat 1 and the game starts");

const players = [ana, ben];
const wrong = players[1 - ana.room.view.turn];
const wrongMove = legalHouses(ana.room.view.board, 1 - ana.room.view.turn)[0];
wrong.ws.send(JSON.stringify({ type: "move", move: wrongMove }));
await until(wrong, () => wrong.errors.length > 0, "an out-of-turn error");
check(wrong.errors.length === 1, `rejects an out-of-turn move ("${wrong.errors[0]}")`);

const cai = connect(code, "smoke-cai-0003", "Cai");
await until(cai, () => cai.room, "the spectator's snapshot");
check(cai.room.you === null, "a third person watches");

let moves = 0;
while (ana.room.phase === "playing") {
  const turn = ana.room.view.turn;
  const mover = players[turn];
  // Over a real network the mover's copy can arrive a moment after Ana's.
  await until(mover, () => mover.room.moveCount === ana.room.moveCount, "the mover to see the latest board");
  const houses = legalHouses(mover.room.view.board, turn);
  const before = ana.room.moveCount;
  mover.ws.send(JSON.stringify({ type: "move", move: houses[Math.floor(Math.random() * houses.length)] }));
  await until(ana, () => ana.room.moveCount === before + 1, `move ${before + 1}`);
  check(ana.lastMove?.moveNumber === before + 1, `move ${before + 1} arrives with its events`);
  moves++;
  if (moves === 3) {
    ben.ws.close();
    await until(ana, () => ana.room.seats[1].connected === false, "Ben to show as disconnected");
    const back = connect(code, "smoke-ben-0002", "Ben");
    await until(back, () => back.room?.you === 1, "Ben to get his seat back");
    await until(ana, () => ana.room.seats[1].connected, "Ben to show as connected");
    players[1] = back;
    check(true, "a player who drops gets their seat back");
  }
}

const [scoreA, scoreB] = ana.room.result.scores;
check(scoreA + scoreB === 98, `game ends after ${moves} moves with all 98 shells counted (${scoreA} to ${scoreB})`);

players[0].ws.send(JSON.stringify({ type: "rematch" }));
await until(ana, () => ana.room.rematch.length === 1, "the first rematch vote");
players[1].ws.send(JSON.stringify({ type: "rematch" }));
await until(ana, () => ana.room.round === 2, "the second game");
check(ana.room.phase === "playing" && ana.room.moveCount === 0, "a rematch starts a new game when both ask");

const lost = connect("ZZZZZ", "smoke-ana-0001", "Ana");
await until(lost, () => lost.closeCode !== null, "the missing room to close");
check(lost.closeCode === 4404, "a link to a missing room closes with 4404");

for (const client of [...players, cai]) client.ws.close();
console.log("All checks passed.");

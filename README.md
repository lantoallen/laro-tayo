# Laro Tayo!

Filipino games you can play on your phone, at https://laro-tayo.vercel.app.

Right now there's Sungka. You can play it against a bot (easy, medium or hard), pass one phone back and forth with a friend, or make an online room and send a friend the link. Pusoy Dos and a yes-or-no guessing game are next.

## Running it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For online play, also start the room server in a second terminal, and tell the web app where it is:

```bash
cp apps/web/.env.example apps/web/.env.local
npm run dev:server
```

The room server runs on http://localhost:8787 using Cloudflare's local runtime, so you don't need a Cloudflare account to work on it. With both running, this plays a full game against it with two fake players:

```bash
node apps/server/scripts/smoke-test.mjs
```

Other scripts, run from the repo root:

```bash
npm test           # rules, bot, and room tests
npm run lint
npm run typecheck
npm run build
```

## How it's organized

```text
packages/games   Game rules in plain TypeScript, no React
  src/engine     The interface every game follows, plus a seeded random number generator
  src/sungka     Sungka rules, bot, and tests
packages/rooms   Online room logic: seats, turns, rematches, and the messages sent over the socket
apps/server      The room server, a Cloudflare Worker
apps/web         The Next.js app
```

Every game implements the same small interface (`setup`, `legalMoves`, `play`, `view`, `result`, `bot`) in `packages/games/src/engine/types.ts`. The screens and the online rooms only use that interface, so adding a game shouldn't mean touching shared code. `view` is there for games with hidden information: it decides what each player is allowed to see, so in Pusoy Dos nobody's phone will ever receive another player's cards.

Some details about Sungka:

- `play` returns the new board along with a list of what happened (pick up, drop, capture, extra turn, skipped turn). The board on screen replays that list one step at a time to animate the move. One test plays 300 random games and checks that replaying the list always ends on the same board the rules produced, that no shells go missing, and that every game ends.
- The bot uses minimax with alpha-beta pruning. Landing in your own store gives you another turn, so the search can't assume players simply alternate. Hard keeps searching one move deeper until 350 ms are up, which usually means 5 to 9 moves ahead. Medium looks 3 moves ahead, and easy plays a random move half the time.

## Online rooms

Each room is a [Durable Object](https://developers.cloudflare.com/durable-objects/), a small server with its own storage that Cloudflare runs close to the players. The room holds the real game. Browsers only send "I want to play house 3", and the room checks it with the same rules package the bot uses, so a player can't move out of turn or edit their copy of the board to cheat.

- After each move the room sends every player their own view of the game plus the move's events, and each screen animates the move from those events.
- A browser keeps a random player id. If the connection drops, it reconnects with the same id and gets its seat back. Anyone who opens the link after both seats are taken watches.
- The id is sent in the first message over the socket, not in the URL, so it doesn't end up in request logs.
- Rooms use WebSocket hibernation, so a room costs nothing while players think, and a room with no games for a day deletes itself.

The room logic in `packages/rooms` has no Cloudflare code in it, so its tests run in plain Node. `apps/server` is a thin layer that stores the room and passes messages.

### Deploying the room server

This uses Cloudflare's free Workers plan.

1. Make a free account at https://dash.cloudflare.com/sign-up.
2. From the repo root, log in and deploy. The first command opens a browser window to approve access.
   ```bash
   npx wrangler login
   npm run deploy -w @laro/server
   ```
3. Wrangler prints the server's address, like `https://laro-tayo-rooms.<your-subdomain>.workers.dev`. Check it with `node apps/server/scripts/smoke-test.mjs <that address>`.
4. Put that address in `DEFAULT_ROOMS_URL` in `apps/web/src/lib/rooms.ts` and push. You can also set `NEXT_PUBLIC_ROOMS_URL` in Vercel instead, which overrides it.

If the site moves to a new domain, add it to `ALLOWED_ORIGINS` in `apps/server/wrangler.jsonc` and deploy again.

## Sungka rules used here

House rules for Sungka vary between regions. This version:

- Each player has 7 houses and a store on their left. Each house starts with 7 shells.
- Sowing goes clockwise. You drop shells into your own store and skip your opponent's.
- If your last shell lands in your store, you play again. If it lands in a house that already has shells, you pick them all up and keep sowing.
- If your last shell lands in an empty house on your side, you capture it plus everything in the house across. If it lands in an empty house on the other side, your turn ends.
- If your side is empty, your turn is skipped. The game ends when every shell is in a store.
- In the traditional game both players make their first move at the same time. Here players take turns from the start.

These follow the descriptions from [Sparkle Stories](https://www.sparklestories.com/blog/post/sparkle-craft-sungka/) and the [Ludii game database](https://ludii.games/data.php?gameId=121).

---

Made by [Allen Lanto](https://lantoallen.vercel.app).

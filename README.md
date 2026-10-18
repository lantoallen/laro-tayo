# Laro Tayo!

Mga larong Pinoy na pwedeng laruin sa phone.

Right now there's Sungka. You can play it against a bot (easy, medium or hard) or pass one phone back and forth with a friend. Next up are online rooms so you can play friends through a link, then Pusoy Dos and a yes-or-no guessing game.

## Running it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other scripts, run from the repo root:

```bash
npm test           # rules and bot tests
npm run lint
npm run typecheck
npm run build
```

## How it's organized

```text
packages/games   Game rules in plain TypeScript, no React
  src/engine     The interface every game follows, plus a seeded random number generator
  src/sungka     Sungka rules, bot, and tests
apps/web         The Next.js app
```

Every game implements the same small interface (`setup`, `legalMoves`, `play`, `view`, `result`, `bot`) in `packages/games/src/engine/types.ts`. The screens, and later the online rooms, only use that interface, so adding a game shouldn't mean touching shared code. `view` is there for games with hidden information: it decides what each player is allowed to see, so in Pusoy Dos nobody's phone will ever receive another player's cards.

Some details about Sungka:

- `play` returns the new board along with a list of what happened (pick up, drop, capture, extra turn, skipped turn). The board on screen replays that list one step at a time to animate the move. One test plays 300 random games and checks that replaying the list always ends on the same board the rules produced, that no shells go missing, and that every game ends.
- The bot uses minimax with alpha-beta pruning. Landing in your own store gives you another turn, so the search can't assume players simply alternate. Hard keeps searching one move deeper until 350 ms are up, which usually means 5 to 9 moves ahead. Medium looks 3 moves ahead, and easy plays a random move half the time.

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

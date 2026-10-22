# Laro Tayo!

Filipino games and classics you can play on your phone, at https://laro-tayo.vercel.app.

There are fourteen games so far. Five are Filipino: Sungka, Dama (Filipino checkers), and Jak-en-poy (rock, paper, scissors) can be played against a bot (easy, medium or hard), by passing one phone back and forth, or online by sending a friend a link. Pusoy Dos, the card game, is played against three bots. Hulaan Mo is a guessing game for a group sharing one phone.

The other nine are classics played everywhere: Four in a Row, Reversi, Dots and Boxes, Memory, Nine Men's Morris, Sea Battle, Tic-Tac-Toe, Snakes and Ladders, and Pig. They can be played the same three ways, except Sea Battle, which hides each player's ships and so is played against the bot or online.

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
  src/engine     The interface every game follows, seeded random numbers and dice, and the bots' search
  src/sungka     Sungka rules, bot, and tests
  src/dama       Dama rules, bot, and tests
  src/pusoy-dos  Pusoy Dos cards, rules, bots, and tests
  src/hulaan-mo  Hulaan Mo word packs, game logic, and tests
  src/four-in-a-row, src/reversi, src/dots-and-boxes, src/memory, src/morris, src/sea-battle,
  src/tic-tac-toe, src/snakes-and-ladders, src/pig, src/jak-en-poy
                 Rules, bots, and tests for the two-player games that share their screens
packages/rooms   Online room logic: seats, turns, rematches, and the messages sent over the socket
apps/server      The room server, a Cloudflare Worker
apps/web         The Next.js app
```

Every game implements the same small interface (`setup`, `legalMoves`, `play`, `view`, `result`, `bot`) in `packages/games/src/engine/types.ts`. The screens and the online rooms only use that interface, so adding a game shouldn't mean touching shared code. `view` is there for games with hidden information: it decides what each player is allowed to see, so in Pusoy Dos nobody's phone will ever receive another player's cards, in Memory nobody receives a card's face before it's turned up, in Sea Battle nobody receives the other fleet's position, and in Jak-en-poy nobody receives the other player's pick until both have picked.

Hulaan Mo is the exception. It has no moves to choose between and no bot, just a timer and two buttons, so it's a plain reducer (`createGame` and `reduce`) with its own tests instead.

These two-player games share their screens. `apps/web/src/components/board-game` has one setup screen, one game screen for playing on one phone, and one for playing online. Each game only adds a board to draw and a short config: its colors, what to show next to each player's name, and its messages.

Some details about Sungka:

- `play` returns the new board along with a list of what happened (pick up, drop, capture, extra turn, skipped turn). The board on screen replays that list one step at a time to animate the move. One test plays 300 random games and checks that replaying the list always ends on the same board the rules produced, that no shells go missing, and that every game ends.
- The bot uses minimax with alpha-beta pruning. Landing in your own store gives you another turn, so the search can't assume players simply alternate. Hard keeps searching one move deeper until 350 ms are up, which usually means 5 to 9 moves ahead. Medium looks 3 moves ahead, and easy plays a random move half the time.

## Online rooms

Each room is a [Durable Object](https://developers.cloudflare.com/durable-objects/), a small server with its own storage that Cloudflare runs close to the players. The room holds the real game. Browsers only send the move, like "play house 3" in Sungka or "jump from c3 to e5" in Dama, and the room checks it with the same rules package the bot uses, so a player can't move out of turn or edit their copy of the board to cheat.

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

## Dama rules used here

Dama is the Filipino version of checkers. This version:

- An 8 by 8 board, with 12 pieces each on the dark squares of the three rows nearest each player.
- Pieces move one square diagonally forward, and capture by jumping, forward or backward.
- Capturing is required. So is continuing a jump, and taking the line that captures the most pieces.
- A piece that ends its move on the far row becomes a king. Kings move and capture any distance along a diagonal, but can't jump their own pieces or two pieces in a row. Captured pieces come off once the whole move is done, so a piece can't be jumped twice.
- You win by taking all the other player's pieces or leaving them with no moves. To make sure every game ends, 40 moves in a row with no capture and no regular piece moved is a draw. That last rule is this app's own.

These follow the descriptions on [BoardGameGeek](https://boardgamegeek.com/wiki/page/thing:430395) and [Checkers Online](https://checkersonline.io/rules/filipino-checkers/). Some sources say kings can only capture in one direction per turn. This version lets them change direction, as most do.

## Pusoy Dos rules used here

- Four players get 13 cards each. Cards rank from 3 up to 2, and suits break ties: clubs, spades, hearts, then diamonds.
- Whoever has the 3♣ goes first, and the first play has to include it.
- A play is one card, a pair, three of a kind, or a five-card hand: straight, flush, full house, four of a kind with any fifth card, or straight flush, from weakest to strongest.
- The next players beat it with the same number of cards or pass. Passing doesn't take you out of the round. When everyone else passes, the last player starts a new round with anything.
- The first player out of cards wins.
- House rules differ on two points, so this version picks one each: a 2 can't be part of a straight, and flushes are compared by suit first.

Each player only ever receives their own hand. The bots decide from that same limited view, so a test checks that shuffling the other players' cards never changes what a bot plays.

## Hulaan Mo rules used here

- Split into 2 to 4 teams. Each turn, one player holds the phone to their forehead so only the rest of their team can see the word.
- The guesser asks yes-or-no questions. The team can only answer yes, no, or maybe.
- A teammate taps Got it when the guesser says the word, or Skip to move on. Every word guessed before the timer runs out is a point.
- Each team gets the same number of turns (1 to 3), and the team with the most points wins. Turns are 60, 90, or 120 seconds.
- Words come from three packs of 40: Filipino food, places in the Philippines, and everyday things. Mixed uses all 120.

It's based on Pinoy Henyo from Eat Bulaga, where the answers are "oo", "hindi", and "pwede". The screen stays on during a turn where the browser allows it, and the phone buzzes when time runs out.

## Four in a Row rules used here

- The grid has 7 columns and 6 rows. Players take turns dropping a disc into a column, and it falls to the lowest empty space.
- Four of your discs in a line across, up and down, or diagonally wins. If the grid fills up first, it's a draw.

The bot uses the same minimax search as Reversi (`packages/games/src/engine/search.ts`). It scores a position by counting the lines of four each player could still finish, with lines of three worth much more than lines of two. Easy only looks one move ahead, so it takes a win but doesn't block yours. Medium looks 4 moves ahead. Hard keeps searching one move deeper until 0.4 seconds are up, which is usually 7 or 8 moves.

## Reversi rules used here

- Black and white start with two discs each in the middle. Black goes first unless you pick otherwise.
- A move has to trap at least one line of the other player's discs between the new disc and another of yours. Every trapped disc flips.
- A player with no move passes. The game ends when neither player can move, and whoever has more discs wins.

The bot scores the squares it holds (corners are worth the most, and the squares next to an empty corner count against it) plus how many moves each player has. Hard searches for 0.4 seconds, which is 4 to 7 moves in the middle of the game, and plays the last 10 or so moves perfectly.

## Dots and Boxes rules used here

- The board has 6 by 6 dots, so 25 boxes. Players take turns drawing a line between two dots next to each other.
- Drawing the fourth side of a box claims it and gives you another turn. With 25 boxes there's no tie.

The bots don't search ahead. They follow the rules good players use:

- Easy takes boxes when it sees them, but otherwise often draws any line.
- Medium never draws a box's third side while it has a choice, and when it has to, it gives away as few boxes as it can.
- Hard also works out the last few safe lines so the other player has to open the first chain. Once only chains are left it picks which one to give away, and it can take all but the last two boxes of a chain and hand those back, so the other player has to open the next chain too. In testing it beat medium in 74 of 100 games.

## Memory rules used here

- 30 cards are laid face down: 15 pairs, so there's never a tie. The faces are five shapes in three colors.
- Turn over two cards. A match is yours. A miss stays face up until the next card is turned. Either way the turn passes, so players always alternate. (The classic rule gives another turn after a match; this version doesn't, so it's always clear who's next.)

The bot only uses cards that have been turned up before, and a test checks that shuffling the cards nobody has seen never changes its move. Easy remembers each card it has seen with a 30% chance, medium 70%, and hard never forgets.

## Nine Men's Morris rules used here

- Each player has nine pieces to place on the 24 points, one per turn. Then players take turns moving a piece along a line to the next empty point.
- Three in a line is a mill, and takes one of the other player's pieces. Pieces in a mill are safe unless every piece that player has is in one.
- With three pieces left, a player can jump to any empty point. You win when the other player is down to two pieces or can't move. If 50 moves go by without a piece being taken, it's a draw.

The bot uses the same search as Four in a Row and Reversi. It counts pieces first, then mills, lines of two with the third point open, and how free each side's pieces are to move. Hard looks 4 to 6 moves ahead.

## Sea Battle rules used here

- Each side has five ships on a 10 by 10 grid: 5, 4, 3, 3, and 2 squares long. They're placed at random, and no two ships touch, even at the corners.
- Players take turns firing one shot at a time. A ship sinks when every square of it is hit, and sinking the whole fleet wins.

The bots work only from their own shots and the ships they've sunk, and a test checks that moving the other fleet's unsunk ships never changes their shot. Easy fires at random and only sometimes follows up a hit. Medium follows up every hit and otherwise fires on every other square, since no ship is shorter than two. Hard counts every way the ships still afloat could fit around what it knows and fires where a ship is most likely to be. On average easy needs 63 shots to sink a fleet, medium 45, and hard 39.

## Jak-en-poy rules used here

- Each round both players pick rock, paper, or scissors. Rock crushes scissors, scissors cut paper, and paper covers rock. A tie doesn't count.
- The first to win three rounds wins the match.
- Picks are made one after the other, but the first pick stays hidden from the second player until the round is decided, so it plays like picking at the same time. In pass and play, the screen only says that a player has picked, never what.

Easy and medium pick at random, which can't be beaten in the long run. Hard watches what the other player picks most often and plays what beats it, part of the time.

## Tic-Tac-Toe rules used here

- X and O take turns marking an empty square. Three in a line across, up and down, or diagonally wins. A full board with no line is a draw.

The bot uses the same search as Four in a Row and Reversi. Easy only sees its own wins, medium also blocks yours, and hard looks all the way to the end of the game, so it never loses. A test plays it against random moves 200 times to check.

## Snakes and Ladders rules used here

- The board has 100 squares, 8 ladders, and 8 snakes, in a layout made for this game. Both players start off the board.
- Roll the die and move that many squares. The bottom of a ladder takes you up it, and a snake's head takes you down to its tail.
- The first to land exactly on 100 wins. A roll that would go past 100 doesn't move you.

The die is rolled from a seed kept in the game's state (`rollDie` in `packages/games/src/engine/rng.ts`), so the room server decides every roll online, and tests can set up any roll they need. There's nothing to decide in this game, so the bot just rolls and has no levels.

## Pig rules used here

- On your turn, roll the die as many times as you like. Each roll adds to that turn's points.
- Roll a 1 and you lose that turn's points, and the turn passes. Hold to bank the points and pass the die.
- The first to 100 points wins, as soon as they reach it.

Each player's view leaves out the dice seed, so nobody can work out the next roll. Easy banks at 10 points, medium at 20, and hard adjusts around 20 depending on the score, taking more risks when behind and rolling on when the other player is close to winning. Over 4,000 games each, medium beat easy 78% of the time, hard beat easy 80%, and hard beat medium 55%. In a game this lucky, that's about as much as skill can do.

---

Made by [Allen Lanto](https://lantoallen.vercel.app).

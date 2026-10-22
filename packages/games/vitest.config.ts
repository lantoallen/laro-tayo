import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The bot and random-game tests play hundreds of games or search deep trees, so a few take
    // 2 to 4 seconds on their own. When the whole suite runs in parallel on a busy machine they
    // pass Vitest's default 5-second limit and fail as timeouts, even though nothing is wrong.
    testTimeout: 30_000,
  },
});

// Lets Laro Tayo! open without a connection, so games against the bot work offline.
//
// Pages come from the network whenever it's there, and a copy is kept for when it isn't. The scripts, styles,
// and fonts the pages use have a hash of their contents in their names, so a kept copy of one is always right.
// When this is first installed, it saves the games page, every game it links to, and what each page needs.
//
// Change CACHE when this file changes in a way that should throw away what was saved before.
const CACHE = "laro-tayo-1";
const BUILD_FILE = /^\/_next\/static\//;
/** Each update to the site adds new build files. Only the newest this many are kept. */
const MAX_BUILD_FILES = 400;
/** On a connection this slow, a saved copy of the page is shown instead of waiting any longer. */
const SLOW_PAGE_MS = 4000;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Saving everything can fail on a bad connection. Pages still get saved as they're visited.
  event.waitUntil(saveEverything().catch(() => {}));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Rooms, the room server, and anything that isn't a plain read go straight to the network.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (BUILD_FILE.test(url.pathname)) event.respondWith(savedFirst(request));
  else if (request.mode === "navigate") event.respondWith(networkFirst(event));
});

async function saveEverything() {
  const cache = await caches.open(CACHE);
  const games = await savePage(cache, "/games");
  const links = [...games.matchAll(/href="(\/[a-z-]+)"/g)].map((match) => match[1]);
  for (const path of new Set(["/", ...links])) {
    if (path !== "/games") await savePage(cache, path);
  }
}

/** Saves a page and the build files it needs, and returns its HTML. */
async function savePage(cache, path) {
  const response = await fetch(path);
  if (!response.ok || response.redirected) return "";
  const html = await response.clone().text();
  await cache.put(path, response);
  await saveBuildFiles(cache, html);
  return html;
}

/** Saves every build file named in some HTML or CSS, including the fonts a stylesheet loads. */
async function saveBuildFiles(cache, text) {
  const paths = new Set([...text.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)].map((match) => match[0]));
  for (const path of paths) {
    if (await cache.match(path)) continue;
    const response = await fetch(path);
    if (!response.ok) continue;
    if (path.endsWith(".css")) await saveBuildFiles(cache, await response.clone().text());
    await cache.put(path, response);
  }
}

async function savedFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await dropOldBuildFiles(cache);
  }
  return response;
}

async function networkFirst(event) {
  const { request } = event;
  const path = new URL(request.url).pathname;
  const cache = await caches.open(CACHE);
  const saved = await cache.match(path);
  const fromNetwork = fetch(request).then(async (response) => {
    // Rooms only work online, so there's no point keeping them.
    if (response.ok && !response.redirected && !path.startsWith("/room/")) await cache.put(path, response.clone());
    return response;
  });
  // Keep running until the network copy is saved, even if the saved copy was shown first. If the network
  // then fails, that's expected, not an error.
  event.waitUntil(fromNetwork.catch(() => {}));
  try {
    if (!saved) return await fromNetwork;
    // With a saved copy to fall back on, don't wait forever on a weak signal. The network copy still
    // gets saved when it arrives, for next time.
    const slow = new Promise((resolve) => setTimeout(() => resolve(saved), SLOW_PAGE_MS));
    return await Promise.race([fromNetwork, slow]);
  } catch {
    if (saved) return saved;
    if (!path.startsWith("/room/")) {
      const games = await cache.match("/games");
      if (games) return games;
    }
    return offlinePage();
  }
}

async function dropOldBuildFiles(cache) {
  const files = (await cache.keys()).filter((request) => BUILD_FILE.test(new URL(request.url).pathname));
  // Keys come back oldest first.
  for (const request of files.slice(0, Math.max(0, files.length - MAX_BUILD_FILES))) await cache.delete(request);
}

function offlinePage() {
  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline | Laro Tayo!</title>
<style>
  body {
    margin: 0;
    padding: 3rem 1.5rem;
    background: #fdf3d9;
    color: #1b1b1b;
    font: 1rem/1.5 system-ui, sans-serif;
    text-align: center;
  }
  a { color: #0038a8; font-weight: 600; }
  @media (prefers-color-scheme: dark) {
    body { background: #15120d; color: #fdf3d9; }
    a { color: #7aa2ff; }
  }
</style>
<h1>You're offline</h1>
<p>Playing online needs a connection. Games against the bot work offline once you've opened Laro Tayo! with one.</p>
<p><a href="/games">Back to the games</a></p>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

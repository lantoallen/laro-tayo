"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in public/sw.js, which keeps pages for playing
 * offline. Only production builds register it, so it never keeps a copy of a
 * dev server's files.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the site works the same, just not offline.
    });
  }, []);
  return null;
}

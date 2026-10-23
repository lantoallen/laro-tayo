"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Chrome's event for offering to install the site. It isn't in TypeScript's types yet. */
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}

const noChange = () => () => {};
/** Opened from the home screen already. */
const isInstalled = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
/** Safari on an iPhone or iPad, which can add sites to the home screen but has no button for it. */
const isIosSafari = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

/**
 * Offers to add Laro Tayo! to the home screen. On Android and desktop Chrome
 * that's a button. On an iPhone it says how, since Safari has no button for it.
 * It shows nothing once installed, or where the browser can't install sites.
 * `explain` is false where there's only room for the button.
 */
export function InstallButton({ className = "", explain = true }: { className?: string; explain?: boolean }) {
  const installed = useSyncExternalStore(noChange, isInstalled, () => true);
  const ios = useSyncExternalStore(noChange, isIosSafari, () => false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const offer = (event: Event) => {
      // Keep Chrome's own banner away, and offer it from the button instead.
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const added = () => {
      setPrompt(null);
      setDone(true);
    };
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", added);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", added);
    };
  }, []);

  if (done) return explain ? <p className={`text-sm text-muted ${className}`}>Added to your home screen.</p> : null;
  if (installed) return null;
  if (prompt) {
    return (
      <button
        type="button"
        onClick={() => {
          void prompt.prompt();
          setPrompt(null);
        }}
        className={`btn btn-secondary ${className}`}
      >
        Add to home screen
      </button>
    );
  }
  if (ios && explain) {
    return (
      <p className={`text-sm text-muted ${className}`}>
        To keep it on your home screen, tap Share, then Add to Home Screen. Games against the bot work offline after
        that.
      </p>
    );
  }
  return null;
}

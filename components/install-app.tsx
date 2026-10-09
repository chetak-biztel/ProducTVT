"use client";

import { useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";

/* "Install app" banner. Chrome/Edge/Android hand us a `beforeinstallprompt` event we can
   trigger from a button; iPhone Safari has no such API, so there we show the manual steps.
   Hidden once installed (running standalone) or after the user dismisses it. */

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "install-banner-dismissed";

// The browser can fire `beforeinstallprompt` before React mounts, so capture it at module load.
let deferred: InstallPromptEvent | null = null;
let dismissed = readDismissed();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of Chrome's mini-bar
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

function readDismissed() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  dismissed = true;
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // storage blocked (private mode) — the banner just comes back next visit
  }
  notify();
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for touch.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

type Mode = "none" | "prompt" | "ios";

function getMode(): Mode {
  if (dismissed || isStandalone()) return "none";
  if (deferred) return "prompt";
  if (isIOS()) return "ios";
  return "none";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function InstallBanner() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "none" as Mode);
  if (mode === "none") return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null; // a prompt event can only be used once
    notify();
  }

  return (
    <div className="card animate-in mb-5 flex items-center gap-3 p-3 pr-2 sm:p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl accent-soft">
        <Download size={17} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-[var(--text)]">Install ProducTVT</p>
        {mode === "prompt" ? (
          <p className="text-xs text-[var(--text-muted)]">Open it from your home screen like a regular app.</p>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Tap <Share size={12} className="inline -translate-y-px" /> Share, then &ldquo;Add to Home Screen&rdquo;.
          </p>
        )}
      </div>
      {mode === "prompt" && (
        <button type="button" className="btn btn-accent btn-sm shrink-0" onClick={install}>
          Install
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm shrink-0 text-[var(--text-faint)]"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

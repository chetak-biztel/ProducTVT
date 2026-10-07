"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_COOKIE = "theme";

function currentTheme(): "light" | "dark" {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  // Both icons render; CSS in globals.css shows the right one so there's no hydration flash.
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn("theme-toggle btn btn-ghost btn-icon", className)}
      title="Toggle dark mode"
      aria-label="Toggle dark mode"
    >
      <Moon size={17} className="icon-moon" />
      <Sun size={17} className="icon-sun" />
    </button>
  );
}

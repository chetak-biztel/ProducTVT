import { prisma } from "@/lib/db";

export const DEFAULT_ACCENT = "#2563eb";

/** Reads the app-wide accent color; falls back to the default if unset/unavailable. */
export async function getAccentColor(): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "accentColor" } });
    const v = row?.value?.trim();
    if (v && /^#([0-9a-fA-F]{6})$/.test(v)) return v;
  } catch {
    // DB not ready — use default so the app still renders.
  }
  return DEFAULT_ACCENT;
}

/** Pick black/white text for a given hex background based on luminance. */
export function readableForeground(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return "#ffffff";
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#0b1220" : "#ffffff";
}

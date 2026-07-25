import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const DEFAULT_ACCENT = "#2563eb";

function isHexColor(v: string | null | undefined): v is string {
  return !!v && /^#([0-9a-fA-F]{6})$/.test(v.trim());
}

/** Reads the app-wide accent color; falls back to the default if unset/unavailable. */
export async function getAccentColor(): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "accentColor" } });
    if (isHexColor(row?.value)) return row.value.trim();
  } catch {
    // DB not ready — use default so the app still renders.
  }
  return DEFAULT_ACCENT;
}

/** Resolves the accent for the current request: the signed-in user's own color choice
    if they've set one, else the workspace-wide default. */
export async function getEffectiveAccentColor(): Promise<string> {
  const workspaceDefault = await getAccentColor();
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return workspaceDefault;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { accentColor: true } });
    if (isHexColor(user?.accentColor)) return user.accentColor.trim();
  } catch {
    // fall through to the workspace default
  }
  return workspaceDefault;
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

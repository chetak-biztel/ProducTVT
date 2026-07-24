export type ActionState = { ok: boolean; error?: string } | null;

/** Convenience wrapper so server actions can return a consistent shape. */
export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
export const ok = { ok: true as const };

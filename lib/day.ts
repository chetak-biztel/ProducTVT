import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const CATS = new Set(["work", "study", "fun", "workout", "break"]);
/** Fields the page owns and replaces wholesale; changing them bumps `rev`. Same list as the local hub. */
export const PAGE_FIELDS = ["entries", "active", "goals", "breakAfter", "focus", "weeklyGoals", "summaryAt", "reminders"];

export type Span = { id?: string; cat: string; start: number; end: number; [k: string]: unknown };
export const validEntry = (e: Span | null | undefined): e is Span =>
  !!e && CATS.has(e.cat) && Number.isFinite(e.start) && Number.isFinite(e.end) && e.end > e.start;

/** The signed-in user (web page) or the owner of a `Bearer <dayToken>` (the local hub). */
export async function dayUserId(req: Request): Promise<string | null> {
  const m = /^Bearer (\S+)$/.exec(req.headers.get("authorization") ?? "");
  if (m) return (await prisma.user.findUnique({ where: { dayToken: m[1] }, select: { id: true, active: true } }).then((u) => (u?.active ? u : null)))?.id ?? null;
  return (await auth())?.user?.id ?? null;
}

export type DayDoc = Record<string, unknown> & { autoEntries?: Span[]; auto?: unknown };

export async function loadDay(userId: string): Promise<{ rev: number; data: DayDoc }> {
  const row = await prisma.dayState.findUnique({ where: { userId } });
  return { rev: row?.rev ?? 0, data: { autoEntries: [], auto: null, ...((row?.data as DayDoc) ?? {}) } };
}

export const saveDay = (userId: string, rev: number, data: DayDoc) =>
  prisma.dayState.upsert({ where: { userId }, create: { userId, rev, data: data as object }, update: { rev, data: data as object } });

export const json = (body: unknown, status = 200) => Response.json(body, { status });
export const unauthorized = () => json({ error: "unauthorized" }, 401);

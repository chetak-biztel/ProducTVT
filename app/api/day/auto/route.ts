import { dayUserId, loadDay, saveDay, validEntry, json, unauthorized, type Span } from "@/lib/day";

/** The local hub pushes what it detected: the live `auto` session and any sessions it just closed.
    Entries are upserted by id, so a retry never duplicates. */
export async function POST(req: Request) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const body = await req.json().catch(() => null);
  const entries: Span[] = Array.isArray(body?.entries) ? body.entries.filter((e: Span) => validEntry(e) && typeof e.id === "string") : [];
  const cur = await loadDay(uid);
  const list = [...(cur.data.autoEntries ?? [])];
  for (const e of entries) {
    const i = list.findIndex((x) => x.id === e.id);
    if (i < 0) list.push(e);
    else list[i] = e; // the hub owns detected sessions: it re-sends one only when it changed (e.g. a resumed session)
  }
  await saveDay(uid, cur.rev, { ...cur.data, autoEntries: list, auto: body?.auto ?? null });
  return json({ ok: true });
}

import { dayUserId, loadDay, saveDay, validEntry, PAGE_FIELDS, json, unauthorized, type Span } from "@/lib/day";

export async function GET(req: Request) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const { rev, data } = await loadDay(uid);
  return json({ ...data, rev });
}

export async function PUT(req: Request) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const body = await req.json().catch(() => null);
  const { rev, state } = body ?? {};
  const cur = await loadDay(uid);
  // Someone else (usually a heartbeat stopping the manual timer) changed things since the page last looked.
  if (rev !== cur.rev) return json({ ...cur.data, rev: cur.rev }, 409);
  if (!state || !Array.isArray(state.entries) || !state.entries.every((e: Span) => validEntry(e))) return json({ error: "bad state" }, 400);
  const data = { ...cur.data };
  for (const k of PAGE_FIELDS) data[k] = state[k] ?? null;
  await saveDay(uid, cur.rev + 1, data);
  return json({ rev: cur.rev + 1 });
}

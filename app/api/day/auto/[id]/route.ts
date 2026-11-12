import { dayUserId, loadDay, saveDay, validEntry, json, unauthorized } from "@/lib/day";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return change(req, (await params).id, true);
}
export async function DELETE(req: Request, { params }: Ctx) {
  return change(req, (await params).id, false);
}

async function change(req: Request, id: string, patch: boolean) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const cur = await loadDay(uid);
  const list = [...(cur.data.autoEntries ?? [])];
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return json({ error: "not found" }, 404);
  if (patch) {
    const p = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const e = { ...list[i] } as Record<string, unknown>;
    for (const k of ["cat", "start", "end", "note"]) if (k in p) e[k] = p[k];
    if (!validEntry(e as never)) return json({ error: "bad entry" }, 400);
    list[i] = e as never;
  } else list.splice(i, 1);
  await saveDay(uid, cur.rev, { ...cur.data, autoEntries: list });
  return json({ ok: true });
}

import { prisma } from "@/lib/db";
import { toggleTodoDone } from "@/app/(app)/todos/actions";
import { dayUserId, json, unauthorized } from "@/lib/day";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const { id } = await params;
  const done = !!(await req.json().catch(() => ({}))).done;
  // Same action as the Todos page: keeps the linked weekly-plan row and project task in sync.
  try { await toggleTodoDone(id, done); } catch { return json({ error: "not found" }, 404); }
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const { id } = await params;
  const r = await prisma.todo.deleteMany({ where: { id, ownerId: uid } });
  return r.count ? json({ ok: true }) : json({ error: "not found" }, 404);
}

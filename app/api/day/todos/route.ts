import { prisma } from "@/lib/db";
import { dayUserId, json, unauthorized } from "@/lib/day";

// The tracker's todo card is the same Todo table as the Todos page.
const out = (t: { id: string; title: string; done: boolean; createdAt: Date }) => ({ id: t.id, text: t.title, done: t.done, created: t.createdAt.getTime() });

export async function GET(req: Request) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const rows = await prisma.todo.findMany({ where: { ownerId: uid }, orderBy: { createdAt: "desc" }, take: 200 });
  return json(rows.map(out));
}

export async function POST(req: Request) {
  const uid = await dayUserId(req);
  if (!uid) return unauthorized();
  const text = String((await req.json().catch(() => ({}))).text ?? "").trim().slice(0, 200);
  if (!text) return json({ error: "empty" }, 400);
  const last = await prisma.todo.findFirst({ where: { ownerId: uid }, orderBy: { order: "desc" }, select: { order: true } });
  return json(out(await prisma.todo.create({ data: { ownerId: uid, title: text, order: (last?.order ?? -1) + 1 } })));
}

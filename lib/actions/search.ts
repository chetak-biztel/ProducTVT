"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export type SearchResult = {
  id: string;
  kind: "todo" | "plan" | "project" | "note";
  title: string;
  hint?: string;
  href: string;
};

/** Backs the Ctrl+K palette: the signed-in user's todos and notes matching `q`. */
export async function searchEverything(q: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const query = q.trim().slice(0, 100);
  if (query.length < 2) return [];
  const contains = { contains: query, mode: "insensitive" as const };

  const [todos, notes] = await Promise.all([
    prisma.todo.findMany({
      where: { ownerId: user.id, title: contains },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, done: true },
    }),
    prisma.note.findMany({
      where: { ownerId: user.id, OR: [{ title: contains }, { content: contains }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true },
    }),
  ]);

  return [
    ...todos.map((t) => ({
      id: t.id,
      kind: "todo" as const,
      title: t.title,
      hint: t.done ? "Done" : undefined,
      href: "/todos",
    })),
    ...notes.map((n) => ({ id: n.id, kind: "note" as const, title: n.title, href: "/notes" })),
  ];
}

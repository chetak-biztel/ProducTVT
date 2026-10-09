"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { weekKey } from "@/lib/week";

export type SearchResult = {
  id: string;
  kind: "todo" | "plan" | "project" | "note";
  title: string;
  hint?: string;
  href: string;
};

/** Backs the Ctrl+K palette: the signed-in user's todos, plan rows, projects and notes matching `q`. */
export async function searchEverything(q: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const query = q.trim().slice(0, 100);
  if (query.length < 2) return [];
  const contains = { contains: query, mode: "insensitive" as const };

  const [todos, planItems, projects, notes] = await Promise.all([
    prisma.todo.findMany({
      where: { ownerId: user.id, title: contains },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, done: true },
    }),
    prisma.planItem.findMany({
      where: { ownerId: user.id, title: contains },
      orderBy: { weekStartDate: "desc" },
      take: 5,
      select: { id: true, title: true, weekStartDate: true },
    }),
    prisma.project.findMany({
      where: { name: contains, OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] },
      take: 5,
      select: { id: true, name: true },
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
    ...planItems.map((p) => ({
      id: p.id,
      kind: "plan" as const,
      title: p.title,
      hint: `Week of ${p.weekStartDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`,
      href: `/plan?week=${weekKey(p.weekStartDate)}`,
    })),
    ...projects.map((p) => ({ id: p.id, kind: "project" as const, title: p.name, href: `/projects/${p.id}` })),
    ...notes.map((n) => ({ id: n.id, kind: "note" as const, title: n.title, href: "/notes" })),
  ];
}

import { prisma } from "@/lib/db";

export async function getTodos(ownerId: string) {
  return prisma.todo.findMany({
    where: { ownerId },
    include: {
      project: { select: { id: true, name: true } },
      people: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: [{ done: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });
}

/** Projects the user belongs to (or created) — used as tag options on todos. */
export async function getMyProjects(userId: string) {
  return prisma.project.findMany({
    where: { OR: [{ createdById: userId }, { members: { some: { userId } } }] },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

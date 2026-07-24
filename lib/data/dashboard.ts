import { prisma } from "@/lib/db";

export async function getUpcomingTodos(ownerId: string, limit = 5) {
  return prisma.todo.findMany({
    where: { ownerId, done: false },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, title: true, dueDate: true, priority: true },
  });
}

export async function getOpenTodoCount(ownerId: string) {
  return prisma.todo.count({ where: { ownerId, done: false } });
}

import { prisma } from "@/lib/db";

export async function getUpcomingTodos(ownerId: string, limit = 5) {
  return prisma.todo.findMany({
    where: { ownerId, done: false },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, title: true, dueDate: true, priority: true },
  });
}

/** Open todos whose due date is before today — drives the red badge on Todos. */
export async function getOverdueTodoCount(ownerId: string) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return prisma.todo.count({ where: { ownerId, done: false, dueDate: { lt: today } } });
}

export async function getOpenTodoCount(ownerId: string) {
  return prisma.todo.count({ where: { ownerId, done: false } });
}

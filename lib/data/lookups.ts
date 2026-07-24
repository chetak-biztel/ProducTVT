import { prisma } from "@/lib/db";

export async function getCategories(ownerId: string) {
  return prisma.category.findMany({ where: { ownerId, active: true }, orderBy: { order: "asc" } });
}

export async function getAllCategories(ownerId: string) {
  return prisma.category.findMany({ where: { ownerId }, orderBy: { order: "asc" } });
}

export async function getPlanStatuses(ownerId: string) {
  return prisma.planStatus.findMany({ where: { ownerId }, orderBy: { order: "asc" } });
}

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true, role: true },
  });
}

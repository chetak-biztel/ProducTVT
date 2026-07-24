import { prisma } from "@/lib/db";

export async function getPlanColumns(ownerId: string) {
  return prisma.planColumn.findMany({
    where: { ownerId },
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
}

import type { PrismaClient } from "@prisma/client";

export const DEFAULT_STATUSES = [
  { name: "Not started", color: "#ef4444", order: 0, isDefault: true },
  { name: "WIP - Calenderized", color: "#3b82f6", order: 1, isDefault: false },
  { name: "WIP - Not Calenderized", color: "#f59e0b", order: 2, isDefault: false },
  { name: "Paused", color: "#64748b", order: 3, isDefault: false },
  { name: "Done", color: "#22c55e", order: 4, isDefault: false },
];

export const DEFAULT_CATEGORIES = [
  { name: "UPE BlockLine", color: "#2563eb", order: 0 },
  { name: "UPE Stations", color: "#0ea5e9", order: 1 },
  { name: "BiztelAI Platform", color: "#e11d48", order: 2 },
];

/** Gives a (new) user their own starting set of statuses and categories to customize. */
export async function seedBoardDefaultsForUser(prisma: PrismaClient, userId: string) {
  for (const s of DEFAULT_STATUSES) {
    await prisma.planStatus.upsert({
      where: { ownerId_name: { ownerId: userId, name: s.name } },
      update: {},
      create: { ...s, ownerId: userId },
    });
  }
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { ownerId_name: { ownerId: userId, name: c.name } },
      update: {},
      create: { ...c, ownerId: userId },
    });
  }
}

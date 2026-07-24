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

/** Title/Category/Status/Tag as PlanColumn rows — share the same reorder/rename/hide
    UI as user-defined columns, while still being backed by dedicated PlanItem fields. */
export const SYSTEM_COLUMNS = [
  { name: "Title", type: "TEXT" as const, order: 0, systemField: "TITLE" as const },
  { name: "Category", type: "SELECT" as const, order: 1, systemField: "CATEGORY" as const },
  { name: "Status", type: "SELECT" as const, order: 2, systemField: "STATUS" as const },
  { name: "Tag", type: "TEXT" as const, order: 3, systemField: "TAG" as const },
];

/** Gives a (new) user their own starting set of statuses and categories to customize. */
export async function seedBoardDefaultsForUser(prisma: PrismaClient, userId: string) {
  await Promise.all([
    prisma.planStatus.createMany({
      data: DEFAULT_STATUSES.map((s) => ({ ...s, ownerId: userId })),
      skipDuplicates: true,
    }),
    prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, ownerId: userId })),
      skipDuplicates: true,
    }),
    prisma.planColumn.createMany({
      data: SYSTEM_COLUMNS.map((c) => ({ ...c, ownerId: userId })),
      skipDuplicates: true,
    }),
  ]);
}

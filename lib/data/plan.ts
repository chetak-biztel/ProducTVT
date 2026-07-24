import { prisma } from "@/lib/db";
import type { PlanItemDTO } from "@/components/plan/types";

export async function getPlanItems(ownerId: string, weekStartDate: Date) {
  return prisma.planItem.findMany({
    where: { ownerId, weekStartDate },
    include: {
      category: true,
      status: true,
      values: { include: { options: { include: { option: true } } } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

/** Serializes a raw getPlanItems() row (Prisma Dates etc.) into the client-safe DTO shape. */
export function toPlanItemDTOs(items: Awaited<ReturnType<typeof getPlanItems>>): PlanItemDTO[] {
  return items.map((item) => ({
    id: item.id,
    ownerId: item.ownerId,
    title: item.title,
    subTag: item.subTag,
    review: item.review,
    category: item.category,
    status: item.status,
    values: item.values.map((v) => ({
      columnId: v.columnId,
      textValue: v.textValue,
      dateValue: v.dateValue ? v.dateValue.toISOString() : null,
      numberValue: v.numberValue,
      optionIds: v.options.map((o) => o.optionId),
    })),
  }));
}

export async function getPlanWeekSummary(ownerId: string, weekStartDate: Date) {
  const items = await getPlanItems(ownerId, weekStartDate);
  const total = items.length;
  const done = items.filter((i) => i.status?.name === "Done").length;
  return { total, done };
}

/** Per-user task counts for a week, keyed by userId. Used by the team roster. */
export async function getTeamWeekCounts(weekStartDate: Date) {
  const rows = await prisma.planItem.groupBy({
    by: ["ownerId", "statusId"],
    where: { weekStartDate },
    _count: { _all: true },
  });
  const doneStatus = await prisma.planStatus.findFirst({ where: { name: "Done" } });

  const byOwner = new Map<string, { total: number; done: number }>();
  for (const row of rows) {
    const entry = byOwner.get(row.ownerId) ?? { total: 0, done: 0 };
    entry.total += row._count._all;
    if (doneStatus && row.statusId === doneStatus.id) entry.done += row._count._all;
    byOwner.set(row.ownerId, entry);
  }
  return byOwner;
}

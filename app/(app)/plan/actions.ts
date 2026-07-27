"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, isManagerOrAbove, canManageBoardFor } from "@/lib/rbac";
import { addWeeks, parseWeekKey, weekKey } from "@/lib/week";
import { syncTaskDone } from "@/lib/data/task-links";
import { fail, ok, type ActionState } from "@/lib/actions/types";

const canEditPlanFor = canManageBoardFor;

function revalidatePlan(ownerId: string, weekStartDate: Date) {
  const wk = weekKey(weekStartDate);
  revalidatePath(`/plan?week=${wk}`);
  revalidatePath(`/team/${ownerId}?week=${wk}`);
  revalidatePath("/dashboard");
  revalidatePath("/team");
}

const createSchema = z.object({
  ownerId: z.string().min(1),
  weekStartDate: z.string().min(1),
  title: z.string().trim().min(1, "Task is required").max(300),
  categoryId: z.string().optional(),
  subTag: z.string().trim().max(40).optional(),
  statusId: z.string().optional(),
});

export async function createPlanItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    ownerId: formData.get("ownerId"),
    weekStartDate: formData.get("weekStartDate"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId") || undefined,
    subTag: formData.get("subTag") || undefined,
    statusId: formData.get("statusId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const { ownerId, title, categoryId, subTag } = parsed.data;

  if (!canEditPlanFor(user.id, user.role, ownerId)) return fail("Not authorized");

  const weekStartDate = parseWeekKey(parsed.data.weekStartDate);
  let statusId = parsed.data.statusId;
  if (!statusId) {
    const def = await prisma.planStatus.findFirst({ where: { ownerId, isDefault: true } });
    statusId = def?.id;
  }

  // Any `col_<columnId>` fields carry values for this owner's custom columns,
  // submitted from the same "add task" form.
  const columnIds = Array.from(formData.keys())
    .filter((k) => k.startsWith("col_"))
    .map((k) => k.slice(4));
  const columns = columnIds.length
    ? await prisma.planColumn.findMany({ where: { id: { in: columnIds }, ownerId, systemField: null } })
    : [];

  const last = await prisma.planItem.findFirst({
    where: { ownerId, weekStartDate },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.$transaction(async (tx) => {
    const item = await tx.planItem.create({
      data: {
        ownerId,
        weekStartDate,
        title,
        categoryId: categoryId || null,
        subTag: subTag || null,
        statusId: statusId || null,
        order: (last?.order ?? -1) + 1,
      },
    });

    for (const column of columns) {
      if (column.type === "SELECT" || column.type === "MULTI_SELECT") {
        const optionIds = formData.getAll(`col_${column.id}`).map(String);
        if (optionIds.length === 0) continue;
        const value = await tx.planItemValue.create({ data: { planItemId: item.id, columnId: column.id } });
        await tx.planItemValueOption.createMany({
          data: optionIds.map((optionId) => ({ valueId: value.id, optionId })),
        });
      } else {
        const raw = formData.get(`col_${column.id}`);
        if (raw == null || raw === "") continue;
        const data: { textValue?: string; dateValue?: Date; numberValue?: number } = {};
        if (column.type === "TEXT") data.textValue = String(raw);
        else if (column.type === "DATE") data.dateValue = new Date(String(raw));
        else if (column.type === "NUMBER") {
          const n = Number(raw);
          if (!Number.isNaN(n)) data.numberValue = n;
        }
        await tx.planItemValue.create({ data: { planItemId: item.id, columnId: column.id, ...data } });
      }
    }
  });

  revalidatePlan(ownerId, weekStartDate);
  return ok;
}

const fieldSchema = z.object({
  id: z.string().min(1),
  field: z.enum(["title", "categoryId", "subTag", "statusId", "review"]),
  value: z.string(),
});

/** Generic inline-edit for a single field on a plan item. Used by client components (not a <form>). */
export async function updatePlanItemField(input: { id: string; field: string; value: string }) {
  const user = await requireUser();
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");
  const { id, field, value } = parsed.data;

  const item = await prisma.planItem.findUnique({ where: { id } });
  if (!item) throw new Error("Not found");
  if (!canEditPlanFor(user.id, user.role, item.ownerId)) throw new Error("Not authorized");

  // Review remarks: owner may write their own notes; managers may write on any item.
  if (field === "review" && item.ownerId !== user.id && !isManagerOrAbove(user.role)) {
    throw new Error("Not authorized");
  }

  const data: Record<string, string | null> = {};
  if (field === "title") {
    const t = value.trim();
    if (!t) throw new Error("Task cannot be empty");
    data.title = t;
  } else if (field === "categoryId") {
    data.categoryId = value || null;
  } else if (field === "subTag") {
    data.subTag = value.trim() || null;
  } else if (field === "statusId") {
    data.statusId = value || null;
  } else if (field === "review") {
    data.review = value.trim() || null;
  }

  await prisma.planItem.update({ where: { id }, data });

  if (field === "statusId" && item.sourceTaskId) {
    const status = value ? await prisma.planStatus.findUnique({ where: { id: value } }) : null;
    await syncTaskDone(item.sourceTaskId, status?.name === "Done", "planItem");
  }

  revalidatePlan(item.ownerId, item.weekStartDate);
}

export async function deletePlanItem(id: string) {
  const user = await requireUser();
  const item = await prisma.planItem.findUnique({ where: { id } });
  if (!item) return;
  if (!canEditPlanFor(user.id, user.role, item.ownerId)) throw new Error("Not authorized");

  await prisma.planItem.delete({ where: { id } });
  revalidatePlan(item.ownerId, item.weekStartDate);
}

/** Persists a new drag-and-drop row order for a set of tasks (must all belong to one owner). */
export async function reorderPlanItems(ownerId: string, orderedIds: string[]) {
  const user = await requireUser();
  if (!canEditPlanFor(user.id, user.role, ownerId)) throw new Error("Not authorized");

  const owned = await prisma.planItem.findMany({
    where: { id: { in: orderedIds }, ownerId },
    select: { id: true, weekStartDate: true },
  });
  if (owned.length !== orderedIds.length) throw new Error("Invalid item list");

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.planItem.update({ where: { id }, data: { order: index } })),
  );
  revalidatePlan(ownerId, owned[0].weekStartDate);
}

/** Duplicates every task from the previous week onto `weekStartKey`, appended after any existing rows. */
export async function copyPreviousWeekPlan(ownerId: string, weekStartKey: string) {
  const user = await requireUser();
  if (!canEditPlanFor(user.id, user.role, ownerId)) throw new Error("Not authorized");

  const weekStartDate = parseWeekKey(weekStartKey);
  const prevWeekStart = addWeeks(weekStartDate, -1);

  const [prevItems, last] = await Promise.all([
    prisma.planItem.findMany({
      where: { ownerId, weekStartDate: prevWeekStart },
      include: { values: { include: { options: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.planItem.findFirst({
      where: { ownerId, weekStartDate: weekStartDate },
      orderBy: { order: "desc" },
      select: { order: true },
    }),
  ]);
  if (prevItems.length === 0) throw new Error("Last week has no tasks to copy.");

  let order = (last?.order ?? -1) + 1;

  await prisma.$transaction(async (tx) => {
    for (const item of prevItems) {
      const newItem = await tx.planItem.create({
        data: {
          ownerId,
          weekStartDate,
          title: item.title,
          categoryId: item.categoryId,
          subTag: item.subTag,
          statusId: item.statusId,
          order: order++,
        },
      });

      for (const value of item.values) {
        const newValue = await tx.planItemValue.create({
          data: {
            planItemId: newItem.id,
            columnId: value.columnId,
            textValue: value.textValue,
            dateValue: value.dateValue,
            numberValue: value.numberValue,
          },
        });
        if (value.options.length) {
          await tx.planItemValueOption.createMany({
            data: value.options.map((o) => ({ valueId: newValue.id, optionId: o.optionId })),
          });
        }
      }
    }
  });

  revalidatePlan(ownerId, weekStartDate);
  return prevItems.length;
}

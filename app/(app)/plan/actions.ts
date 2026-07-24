"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, isManagerOrAbove, canManageBoardFor } from "@/lib/rbac";
import { parseWeekKey, weekKey } from "@/lib/week";
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
    const def = await prisma.planStatus.findFirst({ where: { isDefault: true } });
    statusId = def?.id;
  }

  const last = await prisma.planItem.findFirst({
    where: { ownerId, weekStartDate },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.planItem.create({
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

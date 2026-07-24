"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, canManageBoardFor } from "@/lib/rbac";
import { fail, ok, type ActionState } from "@/lib/actions/types";

function assertCanManage(actorId: string, actorRole: string, boardOwnerId: string) {
  if (!canManageBoardFor(actorId, actorRole, boardOwnerId)) throw new Error("Not authorized");
}

function revalidateBoard(ownerId: string) {
  revalidatePath("/plan");
  revalidatePath(`/team/${ownerId}`);
}

const columnTypeSchema = z.enum(["TEXT", "DATE", "NUMBER", "SELECT", "MULTI_SELECT"]);

// ---------- Columns ----------

const createColumnSchema = z.object({
  ownerId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  type: columnTypeSchema,
});

export async function createColumnAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createColumnSchema.safeParse({
    ownerId: formData.get("ownerId"),
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!canManageBoardFor(user.id, user.role, parsed.data.ownerId)) return fail("Not authorized");

  const existing = await prisma.planColumn.findUnique({
    where: { ownerId_name: { ownerId: parsed.data.ownerId, name: parsed.data.name } },
  });
  if (existing) return fail("A column with that name already exists");

  const last = await prisma.planColumn.findFirst({
    where: { ownerId: parsed.data.ownerId },
    orderBy: { order: "desc" },
  });
  await prisma.planColumn.create({
    data: { ...parsed.data, order: (last?.order ?? -1) + 1 },
  });
  revalidateBoard(parsed.data.ownerId);
  return ok;
}

export async function renameColumn(id: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty");
  const column = await prisma.planColumn.findUnique({ where: { id } });
  if (!column) return;
  assertCanManage(user.id, user.role, column.ownerId);
  await prisma.planColumn.update({ where: { id }, data: { name: trimmed } });
  revalidateBoard(column.ownerId);
}

export async function deleteColumnAction(id: string) {
  const user = await requireUser();
  const column = await prisma.planColumn.findUnique({ where: { id } });
  if (!column) return;
  assertCanManage(user.id, user.role, column.ownerId);
  await prisma.planColumn.delete({ where: { id } });
  revalidateBoard(column.ownerId);
}

// ---------- Column options (Select / Multi-select) ----------

const optionSchema = z.object({
  columnId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
});

export async function createColumnOptionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = optionSchema.safeParse({
    columnId: formData.get("columnId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const column = await prisma.planColumn.findUnique({ where: { id: parsed.data.columnId } });
  if (!column) return fail("Column not found");
  if (!canManageBoardFor(user.id, user.role, column.ownerId)) return fail("Not authorized");

  const existing = await prisma.planColumnOption.findUnique({
    where: { columnId_name: { columnId: parsed.data.columnId, name: parsed.data.name } },
  });
  if (existing) return fail("An option with that name already exists");

  const last = await prisma.planColumnOption.findFirst({
    where: { columnId: parsed.data.columnId },
    orderBy: { order: "desc" },
  });
  await prisma.planColumnOption.create({
    data: { ...parsed.data, order: (last?.order ?? -1) + 1 },
  });
  revalidateBoard(column.ownerId);
  return ok;
}

export async function updateColumnOptionColor(id: string, color: string) {
  const user = await requireUser();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Invalid color");
  const option = await prisma.planColumnOption.findUnique({ where: { id }, include: { column: true } });
  if (!option) return;
  assertCanManage(user.id, user.role, option.column.ownerId);
  await prisma.planColumnOption.update({ where: { id }, data: { color } });
  revalidateBoard(option.column.ownerId);
}

export async function deleteColumnOptionAction(id: string) {
  const user = await requireUser();
  const option = await prisma.planColumnOption.findUnique({ where: { id }, include: { column: true } });
  if (!option) return;
  assertCanManage(user.id, user.role, option.column.ownerId);
  await prisma.planColumnOption.delete({ where: { id } });
  revalidateBoard(option.column.ownerId);
}

// ---------- Item values ----------

async function assertCanEditItem(planItemId: string, user: { id: string; role: string }) {
  const item = await prisma.planItem.findUnique({ where: { id: planItemId }, select: { ownerId: true, weekStartDate: true } });
  if (!item) throw new Error("Not found");
  assertCanManage(user.id, user.role, item.ownerId);
  return item;
}

/** Text / Date / Number columns: one scalar value per cell. */
export async function setPlanItemScalarValue(input: {
  planItemId: string;
  columnId: string;
  type: "TEXT" | "DATE" | "NUMBER";
  value: string;
}) {
  const user = await requireUser();
  const item = await assertCanEditItem(input.planItemId, user);

  const data: { textValue?: string | null; dateValue?: Date | null; numberValue?: number | null } = {};
  if (input.type === "TEXT") {
    data.textValue = input.value.trim() || null;
  } else if (input.type === "DATE") {
    data.dateValue = input.value ? new Date(input.value) : null;
  } else {
    const n = input.value.trim() === "" ? null : Number(input.value);
    if (n !== null && Number.isNaN(n)) throw new Error("Invalid number");
    data.numberValue = n;
  }

  await prisma.planItemValue.upsert({
    where: { planItemId_columnId: { planItemId: input.planItemId, columnId: input.columnId } },
    update: data,
    create: { planItemId: input.planItemId, columnId: input.columnId, ...data },
  });
  revalidateBoard(item.ownerId);
}

/** Select (single) or Multi-select columns: replaces the chosen option(s) for a cell. */
export async function setPlanItemOptionValue(input: { planItemId: string; columnId: string; optionIds: string[] }) {
  const user = await requireUser();
  const item = await assertCanEditItem(input.planItemId, user);

  const value = await prisma.planItemValue.upsert({
    where: { planItemId_columnId: { planItemId: input.planItemId, columnId: input.columnId } },
    update: {},
    create: { planItemId: input.planItemId, columnId: input.columnId },
  });

  const ids = Array.from(new Set(input.optionIds)).slice(0, 30);
  await prisma.$transaction([
    prisma.planItemValueOption.deleteMany({ where: { valueId: value.id } }),
    prisma.planItemValueOption.createMany({ data: ids.map((optionId) => ({ valueId: value.id, optionId })) }),
  ]);
  revalidateBoard(item.ownerId);
}

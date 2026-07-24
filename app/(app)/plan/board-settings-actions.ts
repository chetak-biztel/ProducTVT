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

// ---------- Categories ----------

const categorySchema = z.object({
  ownerId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
});

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse({
    ownerId: formData.get("ownerId"),
    name: formData.get("tagName"),
    color: formData.get("color"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!canManageBoardFor(user.id, user.role, parsed.data.ownerId)) return fail("Not authorized");

  const [existing, last] = await Promise.all([
    prisma.category.findUnique({
      where: { ownerId_name: { ownerId: parsed.data.ownerId, name: parsed.data.name } },
    }),
    prisma.category.findFirst({ where: { ownerId: parsed.data.ownerId }, orderBy: { order: "desc" } }),
  ]);
  if (existing) return fail("A category with that name already exists");
  await prisma.category.create({
    data: { ...parsed.data, order: (last?.order ?? -1) + 1 },
  });
  revalidateBoard(parsed.data.ownerId);
  return ok;
}

export async function updateCategoryColor(id: string, color: string) {
  const user = await requireUser();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Invalid color");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;
  assertCanManage(user.id, user.role, category.ownerId);
  await prisma.category.update({ where: { id }, data: { color } });
  revalidateBoard(category.ownerId);
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const user = await requireUser();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;
  assertCanManage(user.id, user.role, category.ownerId);
  await prisma.category.update({ where: { id }, data: { active } });
  revalidateBoard(category.ownerId);
}

export async function deleteCategoryAction(id: string) {
  const user = await requireUser();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;
  assertCanManage(user.id, user.role, category.ownerId);
  await prisma.category.delete({ where: { id } }).catch(() => {
    // referenced by plan items — soft-deactivate instead
    return prisma.category.update({ where: { id }, data: { active: false } });
  });
  revalidateBoard(category.ownerId);
}

// ---------- Plan statuses ----------

const statusSchema = z.object({
  ownerId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
});

export async function createStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = statusSchema.safeParse({
    ownerId: formData.get("ownerId"),
    name: formData.get("tagName"),
    color: formData.get("color"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!canManageBoardFor(user.id, user.role, parsed.data.ownerId)) return fail("Not authorized");

  const [existing, last] = await Promise.all([
    prisma.planStatus.findUnique({
      where: { ownerId_name: { ownerId: parsed.data.ownerId, name: parsed.data.name } },
    }),
    prisma.planStatus.findFirst({ where: { ownerId: parsed.data.ownerId }, orderBy: { order: "desc" } }),
  ]);
  if (existing) return fail("A status with that name already exists");
  await prisma.planStatus.create({
    data: { ...parsed.data, order: (last?.order ?? -1) + 1 },
  });
  revalidateBoard(parsed.data.ownerId);
  return ok;
}

export async function updateStatusColor(id: string, color: string) {
  const user = await requireUser();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Invalid color");
  const status = await prisma.planStatus.findUnique({ where: { id } });
  if (!status) return;
  assertCanManage(user.id, user.role, status.ownerId);
  await prisma.planStatus.update({ where: { id }, data: { color } });
  revalidateBoard(status.ownerId);
}

export async function setDefaultStatus(id: string) {
  const user = await requireUser();
  const status = await prisma.planStatus.findUnique({ where: { id } });
  if (!status) return;
  assertCanManage(user.id, user.role, status.ownerId);
  await prisma.$transaction([
    prisma.planStatus.updateMany({ where: { ownerId: status.ownerId }, data: { isDefault: false } }),
    prisma.planStatus.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidateBoard(status.ownerId);
}

export async function deleteStatusAction(id: string) {
  const user = await requireUser();
  const status = await prisma.planStatus.findUnique({ where: { id } });
  if (!status) return;
  assertCanManage(user.id, user.role, status.ownerId);

  const count = await prisma.planStatus.count({ where: { ownerId: status.ownerId } });
  if (count <= 1) throw new Error("At least one status is required");

  await prisma.planItem.updateMany({ where: { statusId: id }, data: { statusId: null } });
  await prisma.planStatus.delete({ where: { id } });
  revalidateBoard(status.ownerId);
}

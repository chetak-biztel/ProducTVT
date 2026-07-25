"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { fail, ok, type ActionState } from "@/lib/actions/types";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function changeOwnPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) return fail("Account not found");

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!validCurrent) return fail("Current password is incorrect");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return ok;
}

const accentSchema = z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color") });

export async function setOwnAccentColorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = accentSchema.safeParse({ color: formData.get("color") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid color");

  await prisma.user.update({ where: { id: user.id }, data: { accentColor: parsed.data.color } });
  revalidatePath("/", "layout");
  return ok;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function clearOwnAccentColorAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { accentColor: null } });
  revalidatePath("/", "layout");
  return ok;
}

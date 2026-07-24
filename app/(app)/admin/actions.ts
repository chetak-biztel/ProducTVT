"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { seedBoardDefaultsForUser } from "@/lib/board-defaults";
import { fail, ok, type ActionState } from "@/lib/actions/types";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30)
  .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, numbers, dots, dashes or underscores only");

const roleSchema = z.enum(["FOUNDER", "MANAGER", "EMPLOYEE"]);

// ---------- Users ----------

const createUserSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(1, "Name is required").max(80),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: roleSchema,
});

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return fail("That username is already taken");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
    },
  });

  // Give the new account its own starting board (statuses & categories) to customize.
  await seedBoardDefaultsForUser(prisma, user.id);

  revalidatePath("/admin/users");
  revalidatePath("/team");
  return ok;
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } });
  revalidatePath("/admin/users");
  return ok;
}

export async function setUserActive(userId: string, active: boolean) {
  const actor = await requireManager();
  if (userId === actor.id && !active) throw new Error("You can't deactivate your own account");
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
  revalidatePath("/team");
}

const updateRoleSchema = z.object({ userId: z.string().min(1), role: roleSchema });
export async function updateUserRole(userId: string, role: string) {
  const actor = await requireManager();
  const parsed = updateRoleSchema.safeParse({ userId, role });
  if (!parsed.success) throw new Error("Invalid input");
  if (userId === actor.id) throw new Error("You can't change your own role");
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  revalidatePath("/team");
}

// ---------- Accent color ----------

const accentSchema = z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color") });

export async function setAccentColorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = accentSchema.safeParse({ color: formData.get("color") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid color");

  await prisma.appSetting.upsert({
    where: { key: "accentColor" },
    update: { value: parsed.data.color },
    create: { key: "accentColor", value: parsed.data.color },
  });
  revalidatePath("/", "layout");
  return ok;
}

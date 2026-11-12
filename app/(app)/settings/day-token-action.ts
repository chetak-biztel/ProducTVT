"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

/** Makes (or replaces) the secret the local Day Tracker hub uses to push detected activity. */
export async function regenerateDayToken(): Promise<string> {
  const user = await requireUser();
  const dayToken = randomBytes(24).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { dayToken } });
  return dayToken;
}

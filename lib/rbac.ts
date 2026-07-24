import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Role = "FOUNDER" | "MANAGER" | "EMPLOYEE";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export function isManagerOrAbove(role: string | undefined | null): boolean {
  return role === "FOUNDER" || role === "MANAGER";
}

/** Returns the session user or null (no redirect). */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    username: session.user.username ?? "",
    role: (session.user.role as Role) ?? "EMPLOYEE",
  };
}

/** Requires a logged-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires manager/founder; redirects employees to the dashboard. */
export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isManagerOrAbove(user.role)) redirect("/dashboard");
  return user;
}

/** Throwing guard for use inside server actions. */
export function assertManager(user: SessionUser) {
  if (!isManagerOrAbove(user.role)) throw new Error("Not authorized");
}

/** Whether `actor` may manage a given user's board (weekly plan, statuses, categories, etc.). */
export function canManageBoardFor(actorId: string, actorRole: string, boardOwnerId: string): boolean {
  return boardOwnerId === actorId || isManagerOrAbove(actorRole);
}

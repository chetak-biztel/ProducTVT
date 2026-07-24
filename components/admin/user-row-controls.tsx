"use client";

import { useTransition } from "react";
import { setUserActive, updateUserRole } from "@/app/(app)/admin/actions";
import { cn } from "@/lib/utils";

const ROLES = ["EMPLOYEE", "MANAGER", "FOUNDER"] as const;

export function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      className="select !py-1.5 text-sm"
      defaultValue={role}
      disabled={disabled || pending}
      onChange={(e) => startTransition(() => updateUserRole(userId, e.target.value))}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r === "FOUNDER" ? "Founder" : r === "MANAGER" ? "Manager" : "Employee"}
        </option>
      ))}
    </select>
  );
}

export function ActiveToggle({ userId, active, disabled }: { userId: string; active: boolean; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => startTransition(() => setUserActive(userId, !active))}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        active ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
      )}
      aria-label={active ? "Deactivate account" : "Activate account"}
      title={active ? "Active — click to deactivate" : "Inactive — click to activate"}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform",
          active ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

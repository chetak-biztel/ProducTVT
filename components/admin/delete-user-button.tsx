"use client";

import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/(app)/admin/actions";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function DeleteUserButton({ userId, name, disabled }: { userId: string; name: string; disabled?: boolean }) {
  return (
    <form action={() => deleteUserAction(userId)}>
      <ConfirmButton
        confirm={`Permanently delete ${name}? This removes their account, weekly plans, todos, and custom categories/statuses/columns. Projects and tasks they created are kept. This can't be undone.`}
        className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] hover:!text-rose-600 disabled:hover:!text-[var(--text-faint)]"
        title="Delete account"
        disabled={disabled}
      >
        <Trash2 size={15} />
      </ConfirmButton>
    </form>
  );
}

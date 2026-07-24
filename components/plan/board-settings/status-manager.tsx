"use client";

import { useTransition } from "react";
import { Trash2, Star } from "lucide-react";
import { deleteStatusAction, setDefaultStatus, updateStatusColor } from "@/app/(app)/plan/board-settings-actions";
import { InlineColor } from "@/components/plan/board-settings/inline-color";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

type Status = { id: string; name: string; color: string; isDefault: boolean };

export function StatusManager({ statuses, editable }: { statuses: Status[]; editable: boolean }) {
  const [, startTransition] = useTransition();

  return (
    <div className="divide-y divide-[var(--border)]">
      {statuses.map((s) => (
        <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
          <InlineColor value={s.color} onChange={(color) => updateStatusColor(s.id, color)} disabled={!editable} />
          <span className="flex-1 text-sm font-medium">{s.name}</span>
          {editable && (
            <>
              <button
                type="button"
                onClick={() => startTransition(() => setDefaultStatus(s.id))}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                  s.isDefault ? "accent-soft" : "text-[var(--text-faint)] hover:bg-[var(--bg)]",
                )}
                title={s.isDefault ? "Default status for new tasks" : "Make default for new tasks"}
              >
                <Star size={12} fill={s.isDefault ? "currentColor" : "none"} />
                Default
              </button>
              <form action={() => deleteStatusAction(s.id)}>
                <ConfirmButton
                  confirm={`Remove "${s.name}"? Tasks using it will become unset.`}
                  className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] hover:!text-rose-600"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </ConfirmButton>
              </form>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

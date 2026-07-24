"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";
import {
  createStatusAction,
  deleteStatusAction,
  setDefaultStatus,
  updateStatusColor,
} from "@/app/(app)/plan/board-settings-actions";
import { InlineColor } from "@/components/plan/board-settings/inline-color";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

type Status = { id: string; name: string; color: string; isDefault: boolean };

export function StatusManager({
  ownerId,
  statuses,
  editable,
}: {
  ownerId: string;
  statuses: Status[];
  editable: boolean;
}) {
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const [error, setError] = useState<string | null>(null);
  const [pending, addTransition] = useTransition();

  function addStatus() {
    const t = name.trim();
    if (!t) return;
    setError(null);
    const fd = new FormData();
    fd.set("ownerId", ownerId);
    fd.set("tagName", t);
    fd.set("color", color);
    addTransition(async () => {
      const res = await createStatusAction(null, fd);
      if (res?.error) setError(res.error);
      else setName("");
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="divide-y divide-[var(--border)] rounded-lg bg-[var(--bg)]">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2">
            <InlineColor value={s.color} onChange={(color) => updateStatusColor(s.id, color)} disabled={!editable} />
            <span className="flex-1 text-sm">{s.name}</span>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={() => startTransition(() => setDefaultStatus(s.id))}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                    s.isDefault ? "accent-soft" : "text-[var(--text-faint)] hover:bg-[var(--bg-2)]",
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

      {editable && (
        <div className="flex items-center gap-2 px-1 pt-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-[var(--border-strong)] bg-transparent p-0.5"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStatus()}
            placeholder="New status…"
            className="input flex-1 !py-1 text-sm"
            autoComplete="off"
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!name.trim() || pending} onClick={addStatus}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </div>
      )}
      {error && <p className="px-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

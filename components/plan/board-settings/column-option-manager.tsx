"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  createColumnOptionAction,
  deleteColumnOptionAction,
  updateColumnOptionColor,
} from "@/app/(app)/plan/columns-actions";
import { InlineColor } from "@/components/plan/board-settings/inline-color";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { PlanColumnOptionDTO } from "@/components/plan/types";

export function ColumnOptionManager({
  columnId,
  options,
  editable,
}: {
  columnId: string;
  options: PlanColumnOptionDTO[];
  editable: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addOption() {
    const t = name.trim();
    if (!t) return;
    setError(null);
    const fd = new FormData();
    fd.set("columnId", columnId);
    fd.set("name", t);
    fd.set("color", color);
    startTransition(async () => {
      const res = await createColumnOptionAction(null, fd);
      if (res?.error) setError(res.error);
      else setName("");
    });
  }

  return (
    <div className="mt-2 space-y-1.5 rounded-lg bg-[var(--bg)] p-2.5">
      {options.map((o) => (
        <div key={o.id} className="flex items-center gap-2">
          <InlineColor value={o.color} onChange={(c) => updateColumnOptionColor(o.id, c)} disabled={!editable} />
          <span className="flex-1 text-sm">{o.name}</span>
          {editable && (
            <form action={() => deleteColumnOptionAction(o.id)}>
              <ConfirmButton
                confirm={`Remove "${o.name}"?`}
                className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] hover:!text-rose-600"
              >
                <Trash2 size={13} />
              </ConfirmButton>
            </form>
          )}
        </div>
      ))}
      {options.length === 0 && <p className="px-1 py-1 text-xs text-[var(--text-faint)]">No options yet.</p>}

      {editable && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-[var(--border-strong)] bg-transparent p-0.5"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOption()}
            placeholder="New option…"
            className="input flex-1 !py-1 text-sm"
            autoComplete="off"
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!name.trim() || pending} onClick={addOption}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

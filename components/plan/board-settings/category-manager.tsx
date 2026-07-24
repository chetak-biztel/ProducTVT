"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryActive,
  updateCategoryColor,
} from "@/app/(app)/plan/board-settings-actions";
import { InlineColor } from "@/components/plan/board-settings/inline-color";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; color: string; active: boolean };

export function CategoryManager({
  ownerId,
  categories,
  editable,
}: {
  ownerId: string;
  categories: Category[];
  editable: boolean;
}) {
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [error, setError] = useState<string | null>(null);
  const [pending, addTransition] = useTransition();

  function addCategory() {
    const t = name.trim();
    if (!t) return;
    setError(null);
    const fd = new FormData();
    fd.set("ownerId", ownerId);
    fd.set("tagName", t);
    fd.set("color", color);
    addTransition(async () => {
      const res = await createCategoryAction(null, fd);
      if (res?.error) setError(res.error);
      else setName("");
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="divide-y divide-[var(--border)] rounded-lg bg-[var(--bg)]">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2">
            <InlineColor value={c.color} onChange={(color) => updateCategoryColor(c.id, color)} disabled={!editable} />
            <span className={cn("flex-1 text-sm", !c.active && "text-[var(--text-faint)] line-through")}>{c.name}</span>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={() => startTransition(() => toggleCategoryActive(c.id, !c.active))}
                  className="btn btn-ghost btn-sm"
                >
                  {c.active ? "Deactivate" : "Activate"}
                </button>
                <form action={() => deleteCategoryAction(c.id)}>
                  <ConfirmButton
                    confirm={`Remove "${c.name}"? Existing plan items keep their history.`}
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
        {categories.length === 0 && <p className="px-3 py-3 text-sm text-[var(--text-faint)]">No categories yet.</p>}
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
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="New category…"
            className="input flex-1 !py-1 text-sm"
            autoComplete="off"
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!name.trim() || pending} onClick={addCategory}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </div>
      )}
      {error && <p className="px-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

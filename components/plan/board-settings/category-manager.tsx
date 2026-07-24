"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategoryAction, toggleCategoryActive, updateCategoryColor } from "@/app/(app)/plan/board-settings-actions";
import { InlineColor } from "@/components/plan/board-settings/inline-color";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; color: string; active: boolean };

export function CategoryManager({ categories, editable }: { categories: Category[]; editable: boolean }) {
  const [, startTransition] = useTransition();

  return (
    <div className="divide-y divide-[var(--border)]">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
          <InlineColor value={c.color} onChange={(color) => updateCategoryColor(c.id, color)} disabled={!editable} />
          <span className={cn("flex-1 text-sm font-medium", !c.active && "text-[var(--text-faint)] line-through")}>
            {c.name}
          </span>
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
      {categories.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-[var(--text-faint)]">No categories yet.</p>
      )}
    </div>
  );
}

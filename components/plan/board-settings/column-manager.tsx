"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { deleteColumnAction, renameColumn } from "@/app/(app)/plan/columns-actions";
import { InlineText } from "@/components/plan/inline-text";
import { ColumnOptionManager } from "@/components/plan/board-settings/column-option-manager";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";
import type { PlanColumnDTO } from "@/components/plan/types";

const TYPE_LABEL: Record<PlanColumnDTO["type"], string> = {
  TEXT: "Text",
  DATE: "Date",
  NUMBER: "Number",
  SELECT: "Select",
  MULTI_SELECT: "Multi-select",
};

export function ColumnManager({ columns, editable }: { columns: PlanColumnDTO[]; editable: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (columns.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-[var(--text-faint)]">No custom columns yet.</p>;
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {columns.map((c) => {
        const hasOptions = c.type === "SELECT" || c.type === "MULTI_SELECT";
        const expanded = expandedId === c.id;
        return (
          <div key={c.id} className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              {hasOptions ? (
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  className="text-[var(--text-faint)] hover:text-[var(--text)]"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-3.5" />
              )}
              <InlineText
                value={c.name}
                onSave={(v) => renameColumn(c.id, v)}
                disabled={!editable}
                className={cn("flex-1 text-sm font-medium")}
              />
              <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-faint)]">
                {TYPE_LABEL[c.type]}
              </span>
              {editable && (
                <form action={() => deleteColumnAction(c.id)}>
                  <ConfirmButton
                    confirm={`Remove the "${c.name}" column? Its values on every task will be deleted.`}
                    className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] hover:!text-rose-600"
                  >
                    <Trash2 size={14} />
                  </ConfirmButton>
                </form>
              )}
            </div>
            {hasOptions && expanded && (
              <ColumnOptionManager columnId={c.id} options={c.options} editable={editable} />
            )}
          </div>
        );
      })}
    </div>
  );
}

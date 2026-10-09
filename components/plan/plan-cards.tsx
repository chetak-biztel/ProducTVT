"use client";

import { Trash2 } from "lucide-react";
import { updatePlanItemField, deletePlanItem } from "@/app/(app)/plan/actions";
import { PillSelect } from "@/components/plan/pill-select";
import { InlineText } from "@/components/plan/inline-text";
import { CustomCell } from "@/components/plan/custom-cell";
import { useFeedback } from "@/components/ui/feedback";
import type { PlanCategory, PlanColumnDTO, PlanItemDTO, PlanStatusOpt } from "@/components/plan/types";

/** Phone layout for the weekly plan: one card per task instead of a wide table row.
    Shows the same visible columns as PlanTable, in the same order. */
export function PlanCards({
  items,
  categories,
  statuses,
  columns,
  editable,
  showReview = true,
}: {
  items: PlanItemDTO[];
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  columns: PlanColumnDTO[];
  editable: boolean;
  showReview?: boolean;
}) {
  const visibleColumns = columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order);

  if (items.length === 0) {
    return (
      <div className="card w-full px-4 py-10 text-center text-sm text-[var(--text-muted)]">No tasks for this week yet.</div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <PlanCard
          key={item.id}
          item={item}
          visibleColumns={visibleColumns}
          categories={categories}
          statuses={statuses}
          editable={editable}
          showReview={showReview}
        />
      ))}
    </div>
  );
}

function PlanCard({
  item,
  visibleColumns,
  categories,
  statuses,
  editable,
  showReview,
}: {
  item: PlanItemDTO;
  visibleColumns: PlanColumnDTO[];
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  editable: boolean;
  showReview: boolean;
}) {
  async function save(field: "title" | "categoryId" | "subTag" | "statusId" | "review", value: string) {
    await updatePlanItemField({ id: item.id, field, value });
  }

  const { deleteWithUndo, pendingDeletes } = useFeedback();
  if (pendingDeletes.has(item.id)) return null;

  const has = (field: string) => visibleColumns.some((c) => c.systemField === field);
  const customColumns = visibleColumns.filter((c) => !c.systemField);

  return (
    <div className="card space-y-2.5 p-3.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <InlineText
            value={item.title}
            onSave={(v) => save("title", v)}
            disabled={!editable}
            className="font-medium text-[var(--text)]"
          />
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => deleteWithUndo(item.id, "Task deleted", () => deletePlanItem(item.id))}
            className="btn btn-ghost btn-icon btn-sm -mr-1 -mt-1 shrink-0 text-[var(--text-faint)] hover:!text-rose-600"
            aria-label="Delete task"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {has("STATUS") && (
          <PillSelect
            value={item.status?.id}
            options={statuses}
            disabled={!editable}
            allowClear={false}
            onChange={(id) => save("statusId", id)}
            placeholder="Status"
          />
        )}
        {has("CATEGORY") && (
          <PillSelect
            value={item.category?.id}
            options={categories}
            disabled={!editable}
            onChange={(id) => save("categoryId", id)}
            placeholder="Category"
          />
        )}
        {has("TAG") && (
          <InlineText
            value={item.subTag ?? ""}
            onSave={(v) => save("subTag", v)}
            disabled={!editable}
            placeholder="+ tag"
            className="text-xs text-[var(--text-faint)]"
          />
        )}
      </div>

      {customColumns.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
          {customColumns.map((c) => (
            <div key={c.id} className="contents">
              <dt className="truncate text-xs text-[var(--text-faint)]">{c.name}</dt>
              <dd className="min-w-0">
                <CustomCell
                  planItemId={item.id}
                  column={c}
                  value={item.values.find((v) => v.columnId === c.id)}
                  editable={editable}
                  done={item.status?.name === "Done"}
                />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {showReview && (
        <div className="border-t border-[var(--border)] pt-2">
          <InlineText
            value={item.review ?? ""}
            onSave={(v) => save("review", v)}
            disabled={!editable}
            multiline
            placeholder="+ add remark"
            className="text-sm text-[var(--text-muted)]"
          />
        </div>
      )}
    </div>
  );
}

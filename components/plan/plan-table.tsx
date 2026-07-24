"use client";

import { Trash2 } from "lucide-react";
import { updatePlanItemField, deletePlanItem } from "@/app/(app)/plan/actions";
import { PillSelect } from "@/components/plan/pill-select";
import { InlineText } from "@/components/plan/inline-text";
import { CustomCell } from "@/components/plan/custom-cell";
import type { PlanCategory, PlanColumnDTO, PlanItemDTO, PlanStatusOpt } from "@/components/plan/types";

export function PlanTable({
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
  async function save(id: string, field: "title" | "categoryId" | "subTag" | "statusId" | "review", value: string) {
    await updatePlanItemField({ id, field, value });
  }

  const visibleColumns = columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order);

  if (items.length === 0) {
    return (
      <div className="card w-full px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        No tasks for this week yet.
      </div>
    );
  }

  return (
    <div className="card w-full overflow-x-auto scroll-thin">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
            {visibleColumns.map((c) => (
              <th key={c.id} className={c.systemField === "TITLE" ? "px-3 py-2.5 font-medium" : "w-40 px-3 py-2.5 font-medium"}>
                {c.name}
              </th>
            ))}
            {showReview && <th className="w-56 px-3 py-2.5 font-medium">Review</th>}
            {editable && <th className="w-10 px-2 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--accent)_4%,white)] group">
              {visibleColumns.map((c) => (
                <td key={c.id} className="px-3 py-2 align-top">
                  {c.systemField === "TITLE" ? (
                    <InlineText
                      value={item.title}
                      onSave={(v) => save(item.id, "title", v)}
                      disabled={!editable}
                      className="font-medium text-[var(--text)]"
                    />
                  ) : c.systemField === "CATEGORY" ? (
                    <PillSelect
                      value={item.category?.id}
                      options={categories}
                      disabled={!editable}
                      onChange={(id) => save(item.id, "categoryId", id)}
                      placeholder="Category"
                    />
                  ) : c.systemField === "STATUS" ? (
                    <PillSelect
                      value={item.status?.id}
                      options={statuses}
                      disabled={!editable}
                      allowClear={false}
                      onChange={(id) => save(item.id, "statusId", id)}
                      placeholder="Status"
                    />
                  ) : c.systemField === "TAG" ? (
                    <InlineText
                      value={item.subTag ?? ""}
                      onSave={(v) => save(item.id, "subTag", v)}
                      disabled={!editable}
                      placeholder="+ tag"
                      className="text-xs text-[var(--text-faint)]"
                    />
                  ) : (
                    <CustomCell
                      planItemId={item.id}
                      column={c}
                      value={item.values.find((v) => v.columnId === c.id)}
                      editable={editable}
                    />
                  )}
                </td>
              ))}
              {showReview && (
                <td className="px-3 py-2 align-top">
                  <InlineText
                    value={item.review ?? ""}
                    onSave={(v) => save(item.id, "review", v)}
                    disabled={!editable}
                    multiline
                    placeholder="+ add remark"
                    className="text-[var(--text-muted)]"
                  />
                </td>
              )}
              {editable && (
                <td className="px-2 py-2 align-top text-right">
                  <button
                    type="button"
                    onClick={() => deletePlanItem(item.id)}
                    className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] opacity-0 transition-opacity hover:!text-rose-600 group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

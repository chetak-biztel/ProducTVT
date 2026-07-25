"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { updatePlanItemField, deletePlanItem } from "@/app/(app)/plan/actions";
import { setColumnWidth } from "@/app/(app)/plan/columns-actions";
import { PillSelect } from "@/components/plan/pill-select";
import { InlineText } from "@/components/plan/inline-text";
import { CustomCell } from "@/components/plan/custom-cell";
import type { PlanCategory, PlanColumnDTO, PlanItemDTO, PlanStatusOpt } from "@/components/plan/types";

const MIN_COL_WIDTH = 48;
// Space to leave below the table's scroll area for the add-row bar, gaps, and page padding
// so the table's bottom edge lands just above the fold instead of pushing the page taller.
const RESERVED_BELOW_TABLE = 160;
const MIN_TABLE_HEIGHT = 220;

const REVIEW_COL = "__review__";
const DEFAULT_REVIEW_WIDTH = 224;
const DEFAULT_TITLE_WIDTH = 260;
const CHAR_PX = 7.2; // rough glyph width at text-sm, for sizing a column to its longest value
const PILL_CHROME_PX = 60; // dot + gaps + padding + chevron + cell padding

/** A column's width before anyone drags it: content-aware for pill columns, flat otherwise.
    Every column gets its own independent width — resizing one never resizes its neighbors. */
function defaultColumnWidth(c: PlanColumnDTO, maxSelectedChars: number): number {
  if (c.systemField === "TITLE") return DEFAULT_TITLE_WIDTH;
  if (c.systemField === "TAG") return 72;
  if (c.systemField === "CATEGORY" || c.systemField === "STATUS" || c.type === "SELECT" || c.type === "MULTI_SELECT") {
    return Math.max(96, Math.min(260, Math.round(maxSelectedChars * CHAR_PX + PILL_CHROME_PX)));
  }
  return 160; // custom TEXT / NUMBER / DATE columns
}

/** A wide invisible grab area straddling the column boundary, with a thin always-visible
    line inside it so the resize point is discoverable instead of only appearing on hover. */
function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent<HTMLSpanElement>) => void }) {
  return (
    <span onPointerDown={onPointerDown} className="group/resize absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none">
      <span className="absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-[var(--border-strong)] transition-colors group-hover/resize:bg-[var(--accent)]" />
    </span>
  );
}

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

  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  // Per-column live/just-dragged width overrides, keyed by column id — a map (not a single slot)
  // so resizing one column right after another doesn't discard the first one's override before
  // its server round-trip lands, which used to snap it back to its stale pre-drag width.
  const [dragWidths, setDragWidths] = useState<Record<string, number>>({});
  // Review isn't a real PlanColumn, so its manual width just lives for this session (not persisted).
  const [reviewWidth, setReviewWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    function recompute() {
      const top = containerRef.current?.getBoundingClientRect().top;
      if (top == null) return;
      setMaxHeight(Math.max(MIN_TABLE_HEIGHT, window.innerHeight - top - RESERVED_BELOW_TABLE));
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  function widthFor(c: PlanColumnDTO, maxSelectedChars: number): number {
    return dragWidths[c.id] ?? c.width ?? defaultColumnWidth(c, maxSelectedChars);
  }

  function startResize(e: React.PointerEvent<HTMLSpanElement>, columnId: string) {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = thRefs.current[columnId]?.getBoundingClientRect().width ?? 160;
    const startX = e.clientX;
    document.body.classList.add("select-none");

    function onMove(ev: PointerEvent) {
      const w = Math.max(MIN_COL_WIDTH, Math.round(startWidth + (ev.clientX - startX)));
      setDragWidths((prev) => ({ ...prev, [columnId]: w }));
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      document.body.classList.remove("select-none");
      const finalWidth = Math.max(MIN_COL_WIDTH, Math.round(startWidth + (ev.clientX - startX)));
      setDragWidths((prev) => ({ ...prev, [columnId]: finalWidth }));
      if (columnId === REVIEW_COL) {
        setReviewWidth(finalWidth);
      } else {
        setColumnWidth(columnId, finalWidth).catch(() => {});
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  // Widest value actually selected in each column (across all rows) — used as the starting
  // width for pill columns that haven't been manually resized yet.
  const columnMaxChars = new Map<string, number>(
    visibleColumns.map((c) => {
      let max = 0;
      if (c.systemField === "CATEGORY") {
        for (const item of items) max = Math.max(max, item.category?.name.length ?? 0);
      } else if (c.systemField === "STATUS") {
        for (const item of items) max = Math.max(max, item.status?.name.length ?? 0);
      } else if (c.type === "SELECT" || c.type === "MULTI_SELECT") {
        const nameById = new Map(c.options.map((o) => [o.id, o.name]));
        for (const item of items) {
          const v = item.values.find((vv) => vv.columnId === c.id);
          for (const id of v?.optionIds ?? []) max = Math.max(max, nameById.get(id)?.length ?? 0);
        }
      }
      return [c.id, max];
    }),
  );

  if (items.length === 0) {
    return (
      <div className="card w-full px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        No tasks for this week yet.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="card w-full overflow-auto scroll-thin"
      style={maxHeight != null ? { maxHeight } : undefined}
    >
      <table className="table-fixed border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--surface)]">
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
            {visibleColumns.map((c) => {
              const widthPx = widthFor(c, columnMaxChars.get(c.id) ?? 0);
              return (
                <th
                  key={c.id}
                  ref={(el) => {
                    thRefs.current[c.id] = el;
                  }}
                  style={{ width: widthPx }}
                  className="relative px-3 py-2.5 font-medium"
                >
                  {c.name}
                  {editable && <ResizeHandle onPointerDown={(e) => startResize(e, c.id)} />}
                </th>
              );
            })}
            {showReview && (
              <th
                ref={(el) => {
                  thRefs.current[REVIEW_COL] = el;
                }}
                style={{ width: dragWidths[REVIEW_COL] ?? reviewWidth ?? DEFAULT_REVIEW_WIDTH }}
                className="relative px-3 py-2.5 font-medium"
              >
                Review
                {editable && <ResizeHandle onPointerDown={(e) => startResize(e, REVIEW_COL)} />}
              </th>
            )}
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
                      fillWidth
                    />
                  ) : c.systemField === "STATUS" ? (
                    <PillSelect
                      value={item.status?.id}
                      options={statuses}
                      disabled={!editable}
                      allowClear={false}
                      onChange={(id) => save(item.id, "statusId", id)}
                      placeholder="Status"
                      fillWidth
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
                      fillWidth
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

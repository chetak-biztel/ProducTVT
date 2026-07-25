"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { updatePlanItemField, deletePlanItem, reorderPlanItems } from "@/app/(app)/plan/actions";
import { setColumnWidth } from "@/app/(app)/plan/columns-actions";
import { PillSelect } from "@/components/plan/pill-select";
import { InlineText } from "@/components/plan/inline-text";
import { CustomCell } from "@/components/plan/custom-cell";
import { cn } from "@/lib/utils";
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
const DRAG_HANDLE_COL_WIDTH = 28; // matches the leading th's `w-7`
const DELETE_COL_WIDTH = 40; // matches the trailing th's `w-10`

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

function PlanRow({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editable,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  async function save(field: "title" | "categoryId" | "subTag" | "statusId" | "review", value: string) {
    await updatePlanItemField({ id: item.id, field, value });
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-[var(--border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--accent)_4%,white)] group",
        isDragging && "relative z-10 bg-[var(--surface)] opacity-70",
      )}
    >
      {editable && (
        <td className="px-1 py-2 align-top">
          <span
            {...attributes}
            {...listeners}
            className="flex cursor-grab touch-none rounded p-0.5 text-[var(--text-faint)] opacity-0 hover:bg-[var(--bg)] hover:text-[var(--text)] group-hover:opacity-100"
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} />
          </span>
        </td>
      )}
      {visibleColumns.map((c) => (
        <td key={c.id} className="px-3 py-2 align-top">
          {c.systemField === "TITLE" ? (
            <InlineText
              value={item.title}
              onSave={(v) => save("title", v)}
              disabled={!editable}
              className="font-medium text-[var(--text)]"
            />
          ) : c.systemField === "CATEGORY" ? (
            <PillSelect
              value={item.category?.id}
              options={categories}
              disabled={!editable}
              onChange={(id) => save("categoryId", id)}
              placeholder="Category"
              fillWidth
            />
          ) : c.systemField === "STATUS" ? (
            <PillSelect
              value={item.status?.id}
              options={statuses}
              disabled={!editable}
              allowClear={false}
              onChange={(id) => save("statusId", id)}
              placeholder="Status"
              fillWidth
            />
          ) : c.systemField === "TAG" ? (
            <InlineText
              value={item.subTag ?? ""}
              onSave={(v) => save("subTag", v)}
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
            onSave={(v) => save("review", v)}
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
  const visibleColumns = columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order);

  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  // Per-column live/just-dragged width overrides, keyed by column id — a map (not a single slot)
  // so resizing one column right after another doesn't discard the first one's override before
  // its server round-trip lands, which used to snap it back to its stale pre-drag width.
  const [dragWidths, setDragWidths] = useState<Record<string, number>>({});
  // Review isn't a real PlanColumn, so its manual width just lives for this session (not persisted).
  const [reviewWidth, setReviewWidth] = useState<number | null>(null);
  // Chains column-width saves so a second resize never fires while the first is still in
  // flight. Without this, two overlapping requests can each revalidate the page from their
  // own read of the DB, and if the later request's read happened to run before the earlier
  // request's write had committed, its response reasserts the pre-resize width — visually
  // "undoing" the first drag once the client applies that stale snapshot.
  const columnSaveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  function persistColumnWidth(columnId: string, width: number) {
    columnSaveQueueRef.current = columnSaveQueueRef.current.then(
      () => setColumnWidth(columnId, width),
      () => setColumnWidth(columnId, width),
    );
  }

  // Row order after a drag, as a list of ids — never a snapshot of row *content*, so edits
  // (title, status, custom values, ...) always render from the live `items` prop instead of
  // going stale behind a frozen copy. Falls back to `items` whenever the id set it was built
  // from no longer matches (a task was added/removed elsewhere), so it self-heals instead of
  // needing an effect to resync it.
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const itemById = new Map(items.map((i) => [i.id, i]));
  const liveIds = new Set(items.map((i) => i.id));
  const overrideValid =
    orderOverride != null && orderOverride.length === items.length && orderOverride.every((id) => liveIds.has(id));
  const orderedItems = overrideValid ? orderOverride!.map((id) => itemById.get(id)!) : items;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedItems.findIndex((i) => i.id === active.id);
    const newIndex = orderedItems.findIndex((i) => i.id === over.id);
    const next = arrayMove(orderedItems, oldIndex, newIndex).map((i) => i.id);
    setOrderOverride(next);
    const ownerId = orderedItems[0]?.ownerId;
    if (ownerId) reorderPlanItems(ownerId, next).catch(() => setOrderOverride(null));
  }

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
        persistColumnWidth(columnId, finalWidth);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  // Widest option each pill column could ever show (its own catalog, not just what's picked
  // so far) — capped by defaultColumnWidth, so a board with few or short-valued rows still
  // sizes its columns the same way a heavily-used board does, instead of starting out cramped.
  const columnMaxChars = new Map<string, number>(
    visibleColumns.map((c) => {
      let max = 0;
      if (c.systemField === "CATEGORY") {
        for (const cat of categories) max = Math.max(max, cat.name.length);
      } else if (c.systemField === "STATUS") {
        for (const s of statuses) max = Math.max(max, s.name.length);
      } else if (c.type === "SELECT" || c.type === "MULTI_SELECT") {
        for (const o of c.options) max = Math.max(max, o.name.length);
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

  // table-fixed only honors each column's own width if the <table> itself is at least as
  // wide as their sum — otherwise the browser proportionally squeezes every column to fit
  // the container, so growing one column visually (but not actually) shrinks the others.
  // Summing here forces genuine horizontal scroll instead, matching what was actually dragged.
  const totalTableWidth =
    (editable ? DRAG_HANDLE_COL_WIDTH : 0) +
    visibleColumns.reduce((sum, c) => sum + widthFor(c, columnMaxChars.get(c.id) ?? 0), 0) +
    (showReview ? (dragWidths[REVIEW_COL] ?? reviewWidth ?? DEFAULT_REVIEW_WIDTH) : 0) +
    (editable ? DELETE_COL_WIDTH : 0);

  return (
    <div
      ref={containerRef}
      className="card w-full overflow-auto scroll-thin"
      style={maxHeight != null ? { maxHeight } : undefined}
    >
      <DndContext id="plan-table" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table className="table-fixed border-collapse text-sm" style={{ width: totalTableWidth }}>
          <thead className="sticky top-0 z-10 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
              {editable && <th className="w-7 px-1 py-2.5" />}
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
            <SortableContext items={orderedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {orderedItems.map((item) => (
                <PlanRow
                  key={item.id}
                  item={item}
                  visibleColumns={visibleColumns}
                  categories={categories}
                  statuses={statuses}
                  editable={editable}
                  showReview={showReview}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}

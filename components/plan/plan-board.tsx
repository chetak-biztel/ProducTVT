"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Trash2, GripVertical } from "lucide-react";
import { updatePlanItemField, deletePlanItem } from "@/app/(app)/plan/actions";
import { Pill } from "@/components/ui/pill";
import { InlineText } from "@/components/plan/inline-text";
import { cn } from "@/lib/utils";
import type { PlanCategory, PlanItemDTO, PlanStatusOpt } from "@/components/plan/types";

function Card({ item, editable }: { item: PlanItemDTO; editable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !editable,
  });

  async function save(field: "title" | "review", value: string) {
    await updatePlanItemField({ id: item.id, field, value });
  }

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 20 } : undefined}
      className={cn(
        "card card-hover group relative flex flex-col gap-2 p-3",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.category && <Pill color={item.category.color}>{item.category.name}</Pill>}
          {item.subTag && <span className="text-xs text-[var(--text-faint)]">#{item.subTag}</span>}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {editable && (
            <button
              type="button"
              onClick={() => deletePlanItem(item.id)}
              className="btn btn-ghost btn-icon !p-1 text-[var(--text-faint)] hover:!text-rose-600"
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
          {editable && (
            <span {...listeners} {...attributes} className="cursor-grab touch-none rounded p-1 text-[var(--text-faint)] hover:bg-[var(--bg)]">
              <GripVertical size={13} />
            </span>
          )}
        </div>
      </div>

      <InlineText
        value={item.title}
        onSave={(v) => save("title", v)}
        disabled={!editable}
        className="text-sm font-medium text-[var(--text)]"
      />

      <InlineText
        value={item.review ?? ""}
        onSave={(v) => save("review", v)}
        disabled={!editable}
        placeholder="+ add remark"
        className="text-xs text-[var(--text-muted)]"
      />
    </div>
  );
}

function Column({ status, items, editable }: { status: PlanStatusOpt; items: PlanItemDTO[]; editable: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  return (
    <div className="flex w-72 shrink-0 flex-col gap-2.5">
      <div className="flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
        <h3 className="text-sm font-semibold text-[var(--text)]">{status.name}</h3>
        <span className="text-xs text-[var(--text-faint)]">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-col gap-2.5 rounded-2xl border border-transparent p-1.5 transition-colors",
          isOver && "border-dashed border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,white)]",
        )}
      >
        {items.map((item) => (
          <Card key={item.id} item={item} editable={editable} />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-[var(--text-faint)]">
            Nothing here
          </div>
        )}
      </div>
    </div>
  );
}

export function PlanBoard({
  items,
  statuses,
  editable,
}: {
  items: PlanItemDTO[];
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  editable: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Seeded once from props; the parent remounts this component (via `key`) whenever
  // the server sends fresh data, so no effect-based resync is needed here.
  const [localItems, setLocalItems] = useState(items);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const itemId = String(active.id);
    const newStatusId = String(over.id);
    const current = localItems.find((i) => i.id === itemId);
    if (!current || current.status?.id === newStatusId) return;

    const newStatus = statuses.find((s) => s.id === newStatusId);
    setLocalItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus ?? i.status } : i)),
    );
    updatePlanItemField({ id: itemId, field: "statusId", value: newStatusId }).catch(() => {
      setLocalItems(items);
    });
  }

  const active = activeId ? localItems.find((i) => i.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto scroll-thin pb-2">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            items={localItems.filter((i) => i.status?.id === status.id)}
            editable={editable}
          />
        ))}
      </div>
      <DragOverlay>{active ? <Card item={active} editable={editable} /> : null}</DragOverlay>
    </DndContext>
  );
}

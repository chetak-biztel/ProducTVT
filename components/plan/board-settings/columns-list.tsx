"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import {
  deleteColumnAction,
  renameColumn,
  reorderColumns,
  toggleColumnHidden,
} from "@/app/(app)/plan/columns-actions";
import { InlineText } from "@/components/plan/inline-text";
import { CategoryManager } from "@/components/plan/board-settings/category-manager";
import { StatusManager } from "@/components/plan/board-settings/status-manager";
import { ColumnOptionManager } from "@/components/plan/board-settings/column-option-manager";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";
import type { PlanCategory, PlanColumnDTO, PlanStatusOpt } from "@/components/plan/types";

const TYPE_LABEL: Record<PlanColumnDTO["type"], string> = {
  TEXT: "Text",
  DATE: "Date",
  NUMBER: "Number",
  SELECT: "Select",
  MULTI_SELECT: "Multi-select",
};

function Row({
  column,
  ownerId,
  categories,
  statuses,
  editable,
  expanded,
  onToggleExpand,
}: {
  column: PlanColumnDTO;
  ownerId: string;
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  editable: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const hasOptions = column.type === "SELECT" || column.type === "MULTI_SELECT";
  const isTitle = column.systemField === "TITLE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("px-4 py-2.5", isDragging && "opacity-50 z-10 relative", column.hidden && "opacity-50")}
    >
      <div className="flex items-center gap-2">
        {editable ? (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-0.5 text-[var(--text-faint)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
          >
            <GripVertical size={14} />
          </span>
        ) : (
          <span className="w-[18px]" />
        )}
        {hasOptions ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-[var(--text-faint)] hover:text-[var(--text)]"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        <InlineText
          value={column.name}
          onSave={(v) => renameColumn(column.id, v)}
          disabled={!editable}
          className="flex-1 text-sm font-medium"
        />
        <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-faint)]">
          {TYPE_LABEL[column.type]}
        </span>
        {editable && !isTitle && (
          <button
            type="button"
            onClick={() => toggleColumnHidden(column.id, !column.hidden)}
            className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)]"
            title={column.hidden ? "Show on the table" : "Hide from the table"}
          >
            {column.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {editable && !column.systemField && (
          <form action={() => deleteColumnAction(column.id)}>
            <ConfirmButton
              confirm={`Remove the "${column.name}" column? Its values on every task will be deleted.`}
              className="btn btn-ghost btn-icon btn-sm text-[var(--text-faint)] hover:!text-rose-600"
            >
              <Trash2 size={14} />
            </ConfirmButton>
          </form>
        )}
      </div>

      {hasOptions && expanded && (
        <div className="mt-2 pl-9">
          {column.systemField === "CATEGORY" ? (
            <CategoryManager ownerId={ownerId} categories={categories} editable={editable} />
          ) : column.systemField === "STATUS" ? (
            <StatusManager ownerId={ownerId} statuses={statuses} editable={editable} />
          ) : (
            <ColumnOptionManager columnId={column.id} options={column.options} editable={editable} />
          )}
        </div>
      )}
    </div>
  );
}

export function ColumnsList({
  ownerId,
  categories,
  statuses,
  columns,
  editable,
}: {
  ownerId: string;
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  columns: PlanColumnDTO[];
  editable: boolean;
}) {
  const [order, setOrder] = useState(() => [...columns].sort((a, b) => a.order - b.order));
  const [expandedId, setExpandedId] = useState<string | null>(
    order.find((c) => c.systemField === "CATEGORY")?.id ?? null,
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((c) => c.id === active.id);
    const newIndex = order.findIndex((c) => c.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    reorderColumns(
      ownerId,
      next.map((c) => c.id),
    ).catch(() => setOrder(order));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="card divide-y divide-[var(--border)]">
          {order.map((column) => (
            <Row
              key={column.id}
              column={column}
              ownerId={ownerId}
              categories={categories}
              statuses={statuses}
              editable={editable}
              expanded={expandedId === column.id}
              onToggleExpand={() => setExpandedId(expandedId === column.id ? null : column.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

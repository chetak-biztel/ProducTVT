"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createPlanItem } from "@/app/(app)/plan/actions";
import { PillSelect } from "@/components/plan/pill-select";
import { MultiPillSelect } from "@/components/plan/multi-pill-select";
import { cn } from "@/lib/utils";
import type { PlanCategory, PlanColumnDTO, PlanStatusOpt } from "@/components/plan/types";

type ColValue = string | string[];

/** Keeps every field in the row (pills, inputs, button) the same visual height.
    `grow` lets a slot (just the Title one) actually expand into the row's
    remaining space — otherwise it sizes to its content and traps any
    flex-1 on the child inside, since this slot is the real flex item. */
function FieldSlot({ children, grow = false }: { children: React.ReactNode; grow?: boolean }) {
  return <span className={cn("inline-flex h-8 items-center", grow ? "min-w-[140px] flex-1" : "shrink-0")}>{children}</span>;
}

function CustomColumnField({
  column,
  value,
  onChange,
}: {
  column: PlanColumnDTO;
  value: ColValue | undefined;
  onChange: (v: ColValue) => void;
}) {
  if (column.type === "TEXT") {
    return (
      <FieldSlot>
        <input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={column.name}
          className="input h-8 !w-28 !py-0 text-sm"
          autoComplete="off"
        />
      </FieldSlot>
    );
  }
  if (column.type === "NUMBER") {
    return (
      <FieldSlot>
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={column.name}
          className="input h-8 !w-24 !py-0 text-sm"
        />
      </FieldSlot>
    );
  }
  if (column.type === "DATE") {
    return (
      <FieldSlot>
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="input h-8 !w-[10.5rem] !py-0 text-sm"
        />
      </FieldSlot>
    );
  }
  if (column.type === "SELECT") {
    return (
      <FieldSlot>
        <PillSelect
          value={(value as string) || undefined}
          options={column.options}
          onChange={(id) => onChange(id)}
          placeholder={column.name}
          fillHeight
        />
      </FieldSlot>
    );
  }
  return (
    <FieldSlot>
      <MultiPillSelect
        values={(value as string[]) ?? []}
        options={column.options}
        onChange={(ids) => onChange(ids)}
        placeholder={column.name}
        fillHeight
      />
    </FieldSlot>
  );
}

export function AddItemRow({
  ownerId,
  weekKey,
  categories,
  statuses,
  columns,
  defaultStatusId,
  onAdded,
}: {
  ownerId: string;
  weekKey: string;
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  columns: PlanColumnDTO[];
  defaultStatusId?: string;
  onAdded?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subTag, setSubTag] = useState("");
  const [statusId, setStatusId] = useState(defaultStatusId ?? "");
  const [colValues, setColValues] = useState<Record<string, ColValue>>({});
  const [pending, startTransition] = useTransition();

  function setColValue(columnId: string, v: ColValue) {
    setColValues((prev) => ({ ...prev, [columnId]: v }));
  }

  function submit() {
    const t = title.trim();
    if (!t) return;
    const fd = new FormData();
    fd.set("ownerId", ownerId);
    fd.set("weekStartDate", weekKey);
    fd.set("title", t);
    if (categoryId) fd.set("categoryId", categoryId);
    if (subTag.trim()) fd.set("subTag", subTag.trim());
    if (statusId) fd.set("statusId", statusId);

    for (const column of customColumns) {
      const v = colValues[column.id];
      if (v == null) continue;
      if (Array.isArray(v)) {
        for (const id of v) fd.append(`col_${column.id}`, id);
      } else if (v.trim() !== "") {
        fd.set(`col_${column.id}`, v);
      }
    }

    startTransition(async () => {
      await createPlanItem(null, fd);
      setTitle("");
      setSubTag("");
      setColValues({});
      onAdded?.();
    });
  }

  const visibleColumns = columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order);
  const customColumns = visibleColumns.filter((c) => !c.systemField);

  return (
    <div className="w-full overflow-x-auto scroll-thin rounded-xl border border-dashed border-[var(--border-strong)]">
      <div className="flex w-full items-center gap-2 px-3 py-2.5">
        {visibleColumns.map((c) => {
          if (c.systemField === "TITLE") {
            return (
              <FieldSlot key={c.id} grow>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={`Add a ${c.name.toLowerCase()} for this week…`}
                  className="input h-8 w-full !py-0 text-sm"
                />
              </FieldSlot>
            );
          }
          if (c.systemField === "CATEGORY") {
            return (
              <FieldSlot key={c.id}>
                <PillSelect
                  value={categoryId || undefined}
                  options={categories}
                  onChange={(id) => setCategoryId(id)}
                  placeholder={c.name}
                  fillHeight
                />
              </FieldSlot>
            );
          }
          if (c.systemField === "STATUS") {
            return (
              <FieldSlot key={c.id}>
                <PillSelect
                  value={statusId || undefined}
                  options={statuses}
                  onChange={(id) => setStatusId(id)}
                  placeholder={c.name}
                  allowClear={false}
                  fillHeight
                />
              </FieldSlot>
            );
          }
          if (c.systemField === "TAG") {
            return (
              <FieldSlot key={c.id}>
                <input
                  value={subTag}
                  onChange={(e) => setSubTag(e.target.value)}
                  placeholder={c.name}
                  className="input h-8 !w-20 !py-0 text-sm"
                />
              </FieldSlot>
            );
          }
          return (
            <CustomColumnField key={c.id} column={c} value={colValues[c.id]} onChange={(v) => setColValue(c.id, v)} />
          );
        })}
        <FieldSlot>
          <button
            type="button"
            className="btn btn-accent btn-sm h-8"
            disabled={!title.trim() || pending}
            onClick={submit}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </FieldSlot>
      </div>
    </div>
  );
}

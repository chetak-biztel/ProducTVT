"use client";

import { setPlanItemOptionValue, setPlanItemScalarValue } from "@/app/(app)/plan/columns-actions";
import { InlineText } from "@/components/plan/inline-text";
import { InlineDate } from "@/components/todos/inline-date";
import { PillSelect } from "@/components/plan/pill-select";
import { MultiPillSelect } from "@/components/plan/multi-pill-select";
import type { PlanColumnDTO, PlanItemValueDTO } from "@/components/plan/types";

export function CustomCell({
  planItemId,
  column,
  value,
  editable,
}: {
  planItemId: string;
  column: PlanColumnDTO;
  value: PlanItemValueDTO | undefined;
  editable: boolean;
}) {
  if (column.type === "TEXT") {
    return (
      <InlineText
        value={value?.textValue ?? ""}
        onSave={(v) => setPlanItemScalarValue({ planItemId, columnId: column.id, type: "TEXT", value: v })}
        disabled={!editable}
        placeholder="+ add"
        className="text-sm text-[var(--text)]"
      />
    );
  }

  if (column.type === "NUMBER") {
    return (
      <InlineText
        value={value?.numberValue != null ? String(value.numberValue) : ""}
        onSave={(v) => setPlanItemScalarValue({ planItemId, columnId: column.id, type: "NUMBER", value: v })}
        disabled={!editable}
        inputType="number"
        placeholder="+ add"
        className="text-sm text-[var(--text)]"
      />
    );
  }

  if (column.type === "DATE") {
    return (
      <InlineDate
        value={value?.dateValue ?? null}
        onSave={(v) => setPlanItemScalarValue({ planItemId, columnId: column.id, type: "DATE", value: v })}
        disabled={!editable}
      />
    );
  }

  if (column.type === "SELECT") {
    return (
      <PillSelect
        value={value?.optionIds[0]}
        options={column.options}
        onChange={(id) => setPlanItemOptionValue({ planItemId, columnId: column.id, optionIds: id ? [id] : [] })}
        disabled={!editable}
        placeholder="Set…"
      />
    );
  }

  // MULTI_SELECT
  return (
    <MultiPillSelect
      values={value?.optionIds ?? []}
      options={column.options}
      onChange={(ids) => setPlanItemOptionValue({ planItemId, columnId: column.id, optionIds: ids })}
      disabled={!editable}
      placeholder="Select…"
    />
  );
}

"use client";

import { useTransition } from "react";
import { setProjectStatus, updateProjectField } from "@/app/(app)/projects/actions";
import { InlineText } from "@/components/plan/inline-text";
import { PROJECT_STATUS_OPTIONS } from "@/components/projects/status-badge";

export function ProjectHeader({
  projectId,
  name,
  description,
  status,
}: {
  projectId: string;
  name: string;
  description: string | null;
  status: string;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <InlineText
          value={name}
          onSave={(v) => updateProjectField({ projectId, field: "name", value: v })}
          className="text-2xl font-semibold tracking-tight text-[var(--text)]"
        />
        <InlineText
          value={description ?? ""}
          onSave={(v) => updateProjectField({ projectId, field: "description", value: v })}
          placeholder="+ add a description"
          multiline
          className="mt-1 text-sm text-[var(--text-muted)]"
        />
      </div>
      <select
        defaultValue={status}
        onChange={(e) => startTransition(() => setProjectStatus(projectId, e.target.value))}
        className="select !w-auto shrink-0 text-sm"
      >
        {PROJECT_STATUS_OPTIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

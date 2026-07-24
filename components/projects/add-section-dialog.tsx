"use client";

import { Plus } from "lucide-react";
import { createSectionAction } from "@/app/(app)/projects/actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";

export function AddSectionDialog({ projectId }: { projectId: string }) {
  return (
    <FormDialog
      title="New section"
      action={createSectionAction}
      submitText="Add section"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-faint)] hover:text-[var(--text)]"
        >
          <Plus size={14} /> Section
        </button>
      )}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <Field label="Name" htmlFor="name">
        <input id="name" name="name" className="input" placeholder="e.g. Firmware" autoFocus autoComplete="off" />
      </Field>
      <Field label="Type" htmlFor="type" hint="Used to categorize updates in this section.">
        <select id="type" name="type" className="select" defaultValue="OTHER">
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
          <option value="PROJECT_MGMT">Project management</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>
    </FormDialog>
  );
}

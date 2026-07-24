"use client";

import { Plus } from "lucide-react";
import { createColumnAction } from "@/app/(app)/plan/columns-actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";

export function AddColumnDialog({ ownerId }: { ownerId: string }) {
  return (
    <FormDialog
      title="New column"
      description="Add your own column to the plan table."
      action={createColumnAction}
      submitText="Add column"
      triggerLabel="Add column"
      triggerIcon={<Plus size={14} />}
      triggerClassName="btn btn-outline btn-sm"
    >
      <input type="hidden" name="ownerId" value={ownerId} />
      <Field label="Name" htmlFor="col-name">
        <input id="col-name" name="name" className="input" placeholder="e.g. Due Date" autoFocus autoComplete="off" />
      </Field>
      <Field label="Type" htmlFor="col-type" hint="Select/Multi-select let you define your own list of tags for this column.">
        <select id="col-type" name="type" className="select" defaultValue="TEXT">
          <option value="TEXT">Text</option>
          <option value="DATE">Date</option>
          <option value="NUMBER">Number</option>
          <option value="SELECT">Select (single choice from a list)</option>
          <option value="MULTI_SELECT">Multi-select (multiple choices from a list)</option>
        </select>
      </Field>
    </FormDialog>
  );
}

"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import { ColorInput } from "@/components/ui/color-input";
import type { ActionState } from "@/lib/actions/types";

export function CreateTagDialog({
  ownerId,
  title,
  namePlaceholder,
  defaultColor,
  action,
  triggerLabel,
}: {
  ownerId: string;
  title: string;
  namePlaceholder: string;
  defaultColor: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  triggerLabel: string;
}) {
  return (
    <FormDialog title={title} action={action} submitText="Add" triggerLabel={triggerLabel} triggerIcon={<Plus size={15} />}>
      <input type="hidden" name="ownerId" value={ownerId} />
      <Field label="Name" htmlFor="name">
        <input id="name" name="tagName" className="input" placeholder={namePlaceholder} autoFocus autoComplete="off" />
      </Field>
      <Field label="Color" htmlFor="color">
        <ColorInput name="color" defaultValue={defaultColor} />
      </Field>
    </FormDialog>
  );
}

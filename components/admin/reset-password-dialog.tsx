"use client";

import { KeyRound } from "lucide-react";
import { resetPasswordAction } from "@/app/(app)/admin/actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";

export function ResetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  return (
    <FormDialog
      title={`Reset password for ${name}`}
      description="Set a temporary password and share it with them securely."
      action={resetPasswordAction}
      submitText="Reset password"
      trigger={(open) => (
        <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Reset password" onClick={open}>
          <KeyRound size={15} />
        </button>
      )}
    >
      <input type="hidden" name="userId" value={userId} />
      <Field label="New password" htmlFor="password">
        <input id="password" name="password" type="text" className="input" placeholder="Min. 6 characters" autoComplete="new-password" />
      </Field>
    </FormDialog>
  );
}

"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changeOwnPasswordAction } from "@/app/(app)/settings/actions";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import type { ActionState } from "@/lib/actions/types";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changeOwnPasswordAction, null);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <Field label="Current password" htmlFor="currentPassword">
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="newPassword">
        <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" placeholder="Min. 6 characters" />
      </Field>

      {state?.error && (
        <p className="alert alert-error">{state.error}</p>
      )}
      {state?.ok && (
        <p className="alert alert-success">
          Password updated.
        </p>
      )}

      <button type="submit" className="btn btn-accent" disabled={pending}>
        {pending && <Loader2 size={15} className="animate-spin" />}
        Update password
      </button>
    </form>
  );
}

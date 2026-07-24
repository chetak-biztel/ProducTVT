"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changeOwnPasswordAction } from "@/app/(app)/settings/actions";
import { Field } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions/types";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changeOwnPasswordAction, null);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <Field label="Current password" htmlFor="currentPassword">
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="input" />
      </Field>
      <Field label="New password" htmlFor="newPassword">
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="input" placeholder="Min. 6 characters" />
      </Field>

      {state?.error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
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

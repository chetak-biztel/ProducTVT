"use client";

import { UserPlus } from "lucide-react";
import { createUserAction } from "@/app/(app)/admin/actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";

export function CreateUserDialog() {
  return (
    <FormDialog
      title="Create account"
      description="They'll sign in with this username and password."
      action={createUserAction}
      submitText="Create account"
      triggerLabel="New user"
      triggerIcon={<UserPlus size={15} />}
    >
      <Field label="Full name" htmlFor="name">
        <input id="name" name="name" className="input" placeholder="e.g. Priya Sharma" autoFocus autoComplete="off" />
      </Field>
      <Field label="Username" htmlFor="username" hint="Lowercase letters, numbers, dots or dashes.">
        <input id="username" name="username" className="input" placeholder="e.g. priya" />
      </Field>
      <Field label="Temporary password" htmlFor="password">
        <input id="password" name="password" type="text" className="input" placeholder="Min. 6 characters" />
      </Field>
      <Field label="Role" htmlFor="role">
        <select id="role" name="role" className="select" defaultValue="EMPLOYEE">
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="FOUNDER">Founder</option>
        </select>
      </Field>
    </FormDialog>
  );
}

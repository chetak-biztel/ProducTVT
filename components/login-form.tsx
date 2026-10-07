"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "@/app/login/actions";
import { Field } from "@/components/ui/field";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      <Field label="Username" htmlFor="username">
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoFocus
          className="input"
          placeholder="e.g. chetak"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="••••••••"
        />
      </Field>

      {state?.error && (
        <p className="alert alert-error">{state.error}</p>
      )}

      <button type="submit" className="btn btn-accent w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
        Sign in
      </button>
    </form>
  );
}

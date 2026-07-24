"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/types";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { ok: false, error: "Enter your username and password." };

  try {
    await signIn("credentials", {
      username: username.toLowerCase(),
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid username or password." };
    }
    // signIn throws a redirect on success — must propagate.
    throw error;
  }
  return { ok: true };
}

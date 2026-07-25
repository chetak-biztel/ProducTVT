"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { setOwnAccentColorAction, clearOwnAccentColorAction } from "@/app/(app)/settings/actions";
import type { ActionState } from "@/lib/actions/types";

const SWATCHES = ["#2563eb", "#0ea5e9", "#7c3aed", "#e11d48", "#f59e0b", "#16a34a", "#0f172a"];

export function AppearanceForm({ current, hasOverride }: { current: string; hasOverride: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(setOwnAccentColorAction, null);
  const [clearState, clearAction, clearPending] = useActionState<ActionState, FormData>(clearOwnAccentColorAction, null);
  const [color, setColor] = useState(current);

  useEffect(() => {
    if (state?.ok || clearState?.ok) router.refresh();
  }, [state, clearState, router]);

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="grid h-8 w-8 place-items-center rounded-full border border-black/5 shadow-sm transition-transform hover:scale-105"
              style={{ background: c }}
              aria-label={c}
            >
              {color.toLowerCase() === c.toLowerCase() && <Check size={14} className="text-white" />}
            </button>
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border border-[var(--border-strong)] bg-transparent p-0.5"
            aria-label="Custom color"
          />
          <input type="hidden" name="color" value={color} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-accent btn-sm" disabled={pending}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            Save my color
          </button>
          {hasOverride && (
            <button
              type="submit"
              formAction={clearAction}
              className="text-xs text-[var(--text-faint)] underline-offset-2 hover:underline disabled:opacity-50"
              disabled={clearPending}
            >
              Use workspace default
            </button>
          )}
          {state?.ok && <span className="text-xs text-emerald-600">Saved.</span>}
          {state?.error && <span className="text-xs text-rose-600">{state.error}</span>}
          {clearState?.ok && <span className="text-xs text-emerald-600">Reset.</span>}
          {clearState?.error && <span className="text-xs text-rose-600">{clearState.error}</span>}
        </div>
      </form>
    </div>
  );
}

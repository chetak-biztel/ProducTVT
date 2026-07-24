"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function FormDialog({
  title,
  description,
  action,
  submitText = "Save",
  triggerLabel,
  triggerIcon,
  triggerClassName = "btn btn-accent",
  trigger,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  action: Action;
  submitText?: string;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  /** Custom trigger render; receives an `open` callback. */
  trigger?: (open: () => void) => React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Portals need `document`, which doesn't exist during SSR; derived once at mount,
  // never changes afterward, so no effect is needed to set it.
  const [mounted] = useState(() => typeof document !== "undefined");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Reacts to the server action's result (an external async outcome), closing
    // the dialog once a submission succeeds.
    if (state?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
          {triggerIcon}
          {triggerLabel}
        </button>
      )}

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
            <div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in"
              onClick={() => setOpen(false)}
            />
            <div
              className={cn(
                "relative card animate-in w-full my-auto",
                wide ? "max-w-2xl" : "max-w-md",
              )}
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <div className="flex items-start justify-between gap-4 p-5 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                  {description && <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>}
                </div>
                <button type="button" className="btn btn-ghost btn-icon -mr-2 -mt-1" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form
                ref={formRef}
                onSubmit={(e) => {
                  // Deliberately not using the declarative `action={formAction}` prop:
                  // React auto-resets uncontrolled fields the instant that action settles,
                  // success or failure, wiping everything the user typed on a validation
                  // error. Dispatching manually here means the form only clears when we
                  // explicitly call formRef.current.reset() below, on confirmed success.
                  e.preventDefault();
                  formAction(new FormData(e.currentTarget));
                }}
                className="px-5 pb-5 space-y-4"
              >
                <div className="space-y-4">{children}</div>

                {state?.error && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {state.error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={pending}>
                    {pending && <Loader2 className="animate-spin" size={15} />}
                    {submitText}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

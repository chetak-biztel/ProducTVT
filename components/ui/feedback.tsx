"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* App-wide feedback: toasts (with an optional action such as Undo), a styled confirm dialog
   replacing window.confirm, and deferred deletes that can be undone for a few seconds. */

type Tone = "default" | "success" | "error";
type ToastInput = { message: string; tone?: Tone; action?: { label: string; onClick: () => void }; duration?: number };
type Toast = ToastInput & { id: number };
type ConfirmOptions = { confirmText?: string; danger?: boolean };
type ConfirmState = ConfirmOptions & { message: string; resolve: (ok: boolean) => void };

type FeedbackContextValue = {
  toast: (t: ToastInput) => void;
  confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean>;
  /** Hides `id` right away and runs `run` after a few seconds unless the user taps Undo. */
  deleteWithUndo: (id: string, message: string, run: () => Promise<unknown>) => void;
  pendingDeletes: ReadonlySet<string>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const UNDO_MS = 5000;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<ReadonlySet<string>>(new Set());
  const nextId = useRef(1);
  // Deletes waiting out their undo window: id -> the server call to make.
  const queued = useRef(new Map<string, { run: () => Promise<unknown>; timer: ReturnType<typeof setTimeout> }>());

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.duration ?? (t.action ? UNDO_MS : 3500));
    },
    [dismiss],
  );

  const confirm = useCallback(
    (message: string, opts?: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ message, ...opts, resolve })),
    [],
  );

  const unhide = useCallback((id: string) => {
    setPendingDeletes((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }, []);

  const flush = useCallback(
    (id: string) => {
      const entry = queued.current.get(id);
      if (!entry) return;
      queued.current.delete(id);
      clearTimeout(entry.timer);
      entry.run().catch(() => {
        unhide(id);
        toast({ message: "Couldn't delete — it's been restored.", tone: "error" });
      });
    },
    [toast, unhide],
  );

  const deleteWithUndo = useCallback(
    (id: string, message: string, run: () => Promise<unknown>) => {
      setPendingDeletes((s) => new Set(s).add(id));
      const timer = setTimeout(() => flush(id), UNDO_MS);
      queued.current.set(id, { run, timer });
      toast({
        message,
        action: {
          label: "Undo",
          onClick: () => {
            const entry = queued.current.get(id);
            if (entry) clearTimeout(entry.timer);
            queued.current.delete(id);
            unhide(id);
          },
        },
      });
    },
    [flush, toast, unhide],
  );

  // Leaving the page shouldn't silently cancel deletes the user already chose.
  useEffect(() => {
    const onHide = () => Array.from(queued.current.keys()).forEach(flush);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [flush]);

  function closeConfirm(ok: boolean) {
    confirmState?.resolve(ok);
    setConfirmState(null);
  }

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        confirmState.resolve(false);
        setConfirmState(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmState]);

  const [mounted] = useState(() => typeof document !== "undefined");

  return (
    <FeedbackContext.Provider value={{ toast, confirm, deleteWithUndo, pendingDeletes }}>
      {children}
      {mounted &&
        createPortal(
          <>
            {/* Sits above the phone tab bar; bottom-right on desktop. */}
            <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  role="status"
                  className="card animate-in pointer-events-auto flex w-full max-w-sm items-center gap-3 px-4 py-3 text-sm"
                  style={{ boxShadow: "var(--shadow-lg)" }}
                >
                  {t.tone === "error" ? (
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  ) : t.tone === "success" ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  ) : null}
                  <span className="min-w-0 flex-1 text-[var(--text)]">{t.message}</span>
                  {t.action && (
                    <button
                      type="button"
                      className="shrink-0 font-semibold text-[var(--accent)] hover:underline"
                      onClick={() => {
                        t.action!.onClick();
                        dismiss(t.id);
                      }}
                    >
                      {t.action.label}
                    </button>
                  )}
                  <button
                    type="button"
                    className="shrink-0 text-[var(--text-faint)] hover:text-[var(--text)]"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {confirmState && (
              <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
                <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-[2px] animate-in" onClick={() => closeConfirm(false)} />
                <div
                  role="alertdialog"
                  aria-modal="true"
                  className="card animate-in relative w-full max-w-sm p-5"
                  style={{ boxShadow: "var(--shadow-lg)" }}
                >
                  <p className="text-sm text-[var(--text)]">{confirmState.message}</p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button type="button" className="btn btn-ghost" onClick={() => closeConfirm(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      autoFocus
                      className={cn("btn", confirmState.danger ? "btn-accent !bg-rose-600 !text-white" : "btn-accent")}
                      onClick={() => closeConfirm(true)}
                    >
                      {confirmState.confirmText ?? "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </FeedbackContext.Provider>
  );
}

const fallback: FeedbackContextValue = {
  toast: ({ message }) => window.alert(message),
  confirm: async (message) => window.confirm(message),
  deleteWithUndo: (_id, _message, run) => void run(),
  pendingDeletes: new Set(),
};

export function useFeedback() {
  return useContext(FeedbackContext) ?? fallback;
}

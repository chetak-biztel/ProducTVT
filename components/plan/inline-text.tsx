"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function InlineText({
  value,
  onSave,
  placeholder = "—",
  disabled = false,
  multiline = false,
  inputType = "text",
  className,
  emptyClassName,
}: {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  inputType?: "text" | "number";
  className?: string;
  emptyClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === value.trim()) return;
    startTransition(async () => {
      await onSave(trimmed);
    });
  }

  if (editing) {
    const Comp = multiline ? "textarea" : "input";
    return (
      <Comp
        ref={ref as never}
        type={multiline ? undefined : inputType}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={multiline ? 2 : undefined}
        className={cn(multiline ? "textarea" : "input", "!py-1")}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "block w-full rounded-md px-1.5 py-1 text-left transition-colors",
        !disabled && "hover:bg-[var(--bg)] cursor-text",
        disabled && "cursor-default",
        pending && "opacity-50",
        !value && (emptyClassName ?? "text-[var(--text-faint)]"),
        className,
      )}
    >
      {value || placeholder}
    </button>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function InlineDate({
  value,
  onSave,
  disabled = false,
}: {
  value: string | null;
  onSave: (value: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState(value ? value.slice(0, 10) : "");
  const ref = useRef<HTMLInputElement>(null);
  const overdue = value && !disabled && new Date(value) < new Date(new Date().toDateString());

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => ref.current?.showPicker?.() ?? ref.current?.focus()}
      className={cn(
        "relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        value
          ? overdue
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-[var(--border-strong)] text-[var(--text-muted)]"
          : "border-dashed border-[var(--border-strong)] text-[var(--text-faint)]",
        !disabled && "hover:border-[var(--accent)]",
      )}
    >
      <CalendarClock size={12} />
      {value ? fmt(value) : "Due date"}
      <input
        ref={ref}
        type="date"
        value={local}
        disabled={disabled}
        onChange={(e) => {
          setLocal(e.target.value);
          startTransition(() => onSave(e.target.value));
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Due date"
      />
    </button>
  );
}

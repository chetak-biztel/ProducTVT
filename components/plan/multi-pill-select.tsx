"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import type { PillOption } from "@/components/plan/pill-select";

export function MultiPillSelect({
  values,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: {
  values: string[];
  options: PillOption[];
  onChange: (ids: string[]) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.filter((o) => values.includes(o.id));

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 180) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle(id: string) {
    const next = values.includes(id) ? values.filter((v) => v !== id) : [...values, id];
    setPending(true);
    try {
      await onChange(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex flex-wrap items-center gap-1 rounded-md px-1 py-0.5 transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin text-[var(--text-faint)]" />
        ) : selected.length === 0 ? (
          <span className="pill !bg-transparent !border-dashed text-[var(--text-faint)]">{placeholder}</span>
        ) : (
          selected.map((o) => (
            <Pill key={o.id} color={o.color}>
              {o.name}
            </Pill>
          ))
        )}
        {!disabled && <ChevronDown size={12} className="text-[var(--text-faint)]" />}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="card animate-in fixed z-50 max-h-64 overflow-y-auto scroll-thin p-1.5"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width, boxShadow: "var(--shadow)" }}
          >
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--bg)]"
              >
                <Pill color={o.color}>{o.name}</Pill>
                {values.includes(o.id) && <Check size={14} className="text-[var(--accent)]" />}
              </button>
            ))}
            {options.length === 0 && <p className="px-2.5 py-1.5 text-sm text-[var(--text-faint)]">No options yet</p>}
          </div>,
          document.body,
        )}
    </>
  );
}

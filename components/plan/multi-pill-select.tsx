"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import type { PillOption } from "@/components/plan/pill-select";
import { placeMenu } from "@/components/plan/menu-position";

export function MultiPillSelect({
  values,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
  fillHeight = false,
  fillWidth = false,
}: {
  values: string[];
  options: PillOption[];
  onChange: (ids: string[]) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  /** Stretches pills to fill a fixed-height parent (e.g. a toolbar row), instead of their natural compact size. */
  fillHeight?: boolean;
  /** Fills the width of the parent cell exactly, wrapping/truncating chips instead of forcing the column wider — for use inside a resizable table column. */
  fillWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.filter((o) => values.includes(o.id));

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setPos(placeMenu(r));
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
        className={cn(
          "inline-flex flex-wrap items-center gap-1 rounded-md px-1 py-0.5 transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100",
          fillHeight && "h-full",
          fillWidth && "w-full min-w-0 overflow-hidden",
        )}
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin text-[var(--text-faint)]" />
        ) : selected.length === 0 ? (
          <span className={cn("pill !bg-transparent !border-dashed text-[var(--text-faint)]", fillHeight && "h-full !py-0")}>
            {placeholder}
          </span>
        ) : (
          selected.map((o) => (
            <Pill key={o.id} color={o.color} className={cn(fillWidth && "max-w-full", fillHeight ? "h-full !py-0" : undefined)}>
              <span className={fillWidth ? "truncate" : undefined}>{o.name}</span>
            </Pill>
          ))
        )}
        {!disabled && <ChevronDown size={12} className="shrink-0 text-[var(--text-faint)]" />}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="card animate-in fixed z-50 overflow-y-auto scroll-thin p-1.5"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              minWidth: pos.width,
              maxHeight: pos.maxHeight,
              boxShadow: "var(--shadow)",
            }}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { placeMenu } from "@/components/plan/menu-position";

export type PillOption = { id: string; name: string; color?: string };

export function PillSelect({
  value,
  options,
  onChange,
  placeholder = "Set…",
  disabled = false,
  allowClear = true,
  fillHeight = false,
  fillWidth = false,
}: {
  value?: string | null;
  options: PillOption[];
  onChange: (id: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  /** Stretches the pill to fill a fixed-height parent (e.g. a toolbar row), instead of its natural compact size. */
  fillHeight?: boolean;
  /** Fills the width of the parent cell exactly, truncating the label instead of forcing the column wider — for use inside a resizable table column. */
  fillWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

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
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
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

  async function pick(id: string) {
    setOpen(false);
    setPending(true);
    try {
      await onChange(id);
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
          "inline-flex items-center gap-1 rounded-full transition-opacity",
          fillHeight && "h-full",
          fillWidth && "w-full min-w-0 overflow-hidden",
          disabled ? "cursor-default" : "cursor-pointer hover:opacity-80",
        )}
      >
        {pending ? (
          <Pill dot={false} className={cn(fillWidth && "flex-1 min-w-0", fillHeight && "h-full !py-0")}>
            <Loader2 size={12} className="animate-spin" />
          </Pill>
        ) : selected ? (
          <Pill color={selected.color} className={cn(fillWidth && "flex-1 min-w-0", fillHeight && "h-full !py-0")}>
            <span className={fillWidth ? "truncate" : undefined}>{selected.name}</span>
          </Pill>
        ) : (
          <span
            className={cn(
              "pill !bg-transparent !border-dashed text-[var(--text-faint)]",
              fillWidth && "flex-1 min-w-0",
              fillHeight && "h-full !py-0",
            )}
          >
            <span className={fillWidth ? "truncate" : undefined}>{placeholder}</span>
          </span>
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
            {allowClear && value && (
              <button
                type="button"
                onClick={() => pick("")}
                className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-[var(--text-faint)] hover:bg-[var(--bg)]"
              >
                Clear
              </button>
            )}
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                className="flex w-full items-center rounded-lg px-2 py-1.5 text-left hover:bg-[var(--bg)]"
              >
                <Pill color={o.color}>{o.name}</Pill>
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-2.5 py-1.5 text-sm text-[var(--text-faint)]">No options yet</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

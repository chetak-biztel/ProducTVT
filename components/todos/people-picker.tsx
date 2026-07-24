"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { TodoPersonDTO } from "@/components/todos/types";

export function PeoplePicker({
  people,
  allUsers,
  onChange,
  disabled = false,
}: {
  people: TodoPersonDTO[];
  allUsers: { id: string; name: string }[];
  onChange: (userIds: string[]) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedIds = new Set(people.map((p) => p.id));

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left });
    };
    place();
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(id: string) {
    const next = selectedIds.has(id) ? [...selectedIds].filter((x) => x !== id) : [...selectedIds, id];
    onChange(next);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
      >
        {people.length === 0 ? (
          <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
            <UserPlus size={13} /> Tag people
          </span>
        ) : (
          <span className="flex -space-x-2">
            {people.slice(0, 4).map((p) => (
              <span key={p.id} className="ring-2 ring-[var(--surface)] rounded-full">
                <Avatar name={p.name} size={22} />
              </span>
            ))}
            {people.length > 4 && (
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[var(--bg-2)] text-[10px] font-medium text-[var(--text-muted)] ring-2 ring-[var(--surface)]">
                +{people.length - 4}
              </span>
            )}
          </span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="card animate-in fixed z-50 max-h-64 w-56 overflow-y-auto scroll-thin p-1.5"
            style={{ top: pos.top, left: pos.left, boxShadow: "var(--shadow)" }}
          >
            {allUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--bg)]"
              >
                <Avatar name={u.name} size={22} />
                <span className="flex-1 truncate">{u.name}</span>
                {selectedIds.has(u.id) && <Check size={14} className="text-[var(--accent)]" />}
              </button>
            ))}
            {allUsers.length === 0 && <p className="px-2.5 py-1.5 text-sm text-[var(--text-faint)]">No users</p>}
          </div>,
          document.body,
        )}
    </>
  );
}

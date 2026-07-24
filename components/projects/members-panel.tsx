"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import { addMember, removeMember } from "@/app/(app)/projects/actions";
import { Avatar } from "@/components/ui/avatar";
import type { ProjectMemberDTO } from "@/components/projects/types";

export function MembersPanel({
  projectId,
  members,
  candidates,
  isOwner,
}: {
  projectId: string;
  members: ProjectMemberDTO[];
  candidates: { id: string; name: string }[];
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const memberIds = new Set(members.map((m) => m.user.id));
  const available = candidates.filter((c) => !memberIds.has(c.id));

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 224) });
    };
    place();
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {members.map((m) => (
        <span
          key={m.id}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2 text-xs"
        >
          <Avatar name={m.user.name} size={20} />
          {m.user.name}
          {m.role === "OWNER" && <span className="text-[var(--text-faint)]">· owner</span>}
          {isOwner && m.role !== "OWNER" && (
            <button
              type="button"
              onClick={() => startTransition(() => removeMember(projectId, m.user.id))}
              className="ml-0.5 rounded-full text-[var(--text-faint)] hover:text-rose-600"
              aria-label={`Remove ${m.user.name}`}
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}

      {isOwner && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border-strong)] px-2.5 py-1 text-xs text-[var(--text-faint)] hover:text-[var(--text)]"
        >
          <UserPlus size={13} /> Add
        </button>
      )}

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="card animate-in fixed z-50 max-h-64 w-56 overflow-y-auto scroll-thin p-1.5"
            style={{ top: pos.top, left: pos.left, boxShadow: "var(--shadow)" }}
          >
            {available.length === 0 ? (
              <p className="px-2.5 py-1.5 text-sm text-[var(--text-faint)]">Everyone&apos;s already added</p>
            ) : (
              available.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => startTransition(() => addMember(projectId, u.id))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--bg)]"
                >
                  <Avatar name={u.name} size={22} />
                  {u.name}
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

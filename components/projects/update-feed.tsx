"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { createUpdateAction, deleteUpdate } from "@/app/(app)/projects/actions";
import { Avatar } from "@/components/ui/avatar";
import type { ActionState } from "@/lib/actions/types";
import type { ProjectUpdateDTO } from "@/components/projects/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function UpdateFeed({
  projectId,
  sectionId,
  updates,
  currentUserId,
  canModerate,
}: {
  projectId: string;
  sectionId: string;
  updates: ProjectUpdateDTO[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUpdateAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} className="flex items-start gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <textarea
          name="body"
          rows={2}
          placeholder="Post an update…"
          className="textarea flex-1 text-sm"
        />
        <button type="submit" className="btn btn-accent btn-sm shrink-0" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquarePlus size={14} />}
          Post
        </button>
      </form>
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}

      <div className="space-y-3">
        {updates.map((u) => (
          <div key={u.id} className="flex items-start gap-3 group">
            <Avatar name={u.author.name} size={30} />
            <div className="min-w-0 flex-1 rounded-xl bg-[var(--bg)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--text)]">
                  {u.author.name} <span className="font-normal text-[var(--text-faint)]">· {timeAgo(u.createdAt)}</span>
                </p>
                {(u.author.id === currentUserId || canModerate) && (
                  <button
                    type="button"
                    onClick={() => deleteUpdate(u.id, projectId)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--text-faint)] hover:text-rose-600"
                    aria-label="Delete update"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">{u.body}</p>
            </div>
          </div>
        ))}
        {updates.length === 0 && <p className="text-sm text-[var(--text-faint)]">No updates yet in this section.</p>}
      </div>
    </div>
  );
}

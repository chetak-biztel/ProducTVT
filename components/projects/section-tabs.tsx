"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSectionAction } from "@/app/(app)/projects/actions";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { TaskList } from "@/components/projects/task-list";
import { UpdateFeed } from "@/components/projects/update-feed";
import { AddSectionDialog } from "@/components/projects/add-section-dialog";
import { cn } from "@/lib/utils";
import type { ProjectSectionDTO } from "@/components/projects/types";

export function SectionTabs({
  projectId,
  sections,
  members,
  currentUserId,
  isOwner,
}: {
  projectId: string;
  sections: ProjectSectionDTO[];
  members: { id: string; name: string }[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  if (!active) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-sm text-[var(--text-muted)]">No sections yet.</p>
        <AddSectionDialog projectId={projectId} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] pb-0">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={cn(
              "relative rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors",
              s.id === active.id ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            {s.name}
            {s.id === active.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: "var(--accent)" }} />
            )}
          </button>
        ))}
        <AddSectionDialog projectId={projectId} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)]">Tasks</h3>
            {isOwner && (
              <form action={() => deleteSectionAction(active.id, projectId)}>
                <ConfirmButton
                  confirm={`Remove the "${active.name}" section? Its tasks and updates will be deleted.`}
                  className="text-xs text-[var(--text-faint)] hover:text-rose-600"
                >
                  <span className="flex items-center gap-1">
                    <Trash2 size={12} /> Remove section
                  </span>
                </ConfirmButton>
              </form>
            )}
          </div>
          <TaskList projectId={projectId} sectionId={active.id} tasks={active.tasks} members={members} />
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Updates</h3>
          <UpdateFeed
            projectId={projectId}
            sectionId={active.id}
            updates={active.updates}
            currentUserId={currentUserId}
            canModerate={isOwner}
          />
        </div>
      </div>
    </div>
  );
}

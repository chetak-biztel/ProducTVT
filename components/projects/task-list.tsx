"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, UserCircle2 } from "lucide-react";
import { createTaskAction, deleteTask, setTaskAssignee, setTaskStatus } from "@/app/(app)/projects/actions";
import { PillSelect } from "@/components/plan/pill-select";
import { TASK_STATUS_OPTIONS } from "@/components/projects/status-badge";
import type { ProjectTaskDTO } from "@/components/projects/types";

export function TaskList({
  projectId,
  sectionId,
  tasks,
  members,
}: {
  projectId: string;
  sectionId: string;
  tasks: ProjectTaskDTO[];
  members: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const assigneeOptions = members.map((m) => ({ id: m.id, name: m.name, color: "#2563eb" }));

  function addTask() {
    const t = title.trim();
    if (!t) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("sectionId", sectionId);
    fd.set("title", t);
    startTransition(async () => {
      await createTaskAction(null, fd);
      setTitle("");
    });
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 sm:flex-nowrap sm:gap-2.5">
          <PillSelect
            value={task.status}
            options={TASK_STATUS_OPTIONS}
            allowClear={false}
            onChange={(v) => setTaskStatus(task.id, projectId, v)}
          />
          <span className="order-first basis-full break-words text-sm text-[var(--text)] sm:order-none sm:basis-auto sm:flex-1 sm:truncate">
            {task.title}
          </span>
          {assigneeOptions.length > 0 ? (
            <PillSelect
              value={task.assignee?.id}
              options={assigneeOptions}
              onChange={(v) => setTaskAssignee(task.id, projectId, v)}
              placeholder="Assign"
            />
          ) : (
            task.assignee && (
              <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
                <UserCircle2 size={12} /> {task.assignee.name}
              </span>
            )
          )}
          <button
            type="button"
            onClick={() => deleteTask(task.id, projectId)}
            className="btn btn-ghost btn-icon btn-sm ml-auto text-[var(--text-faint)] hover:!text-rose-600 sm:ml-0"
            aria-label="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task…"
          className="input flex-1 !py-1.5 text-sm"
        />
        <button type="button" className="btn btn-outline btn-sm" disabled={!title.trim() || pending} onClick={addTask}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

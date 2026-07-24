"use client";

import { useTransition } from "react";
import { Trash2, FolderKanban } from "lucide-react";
import {
  deleteTodo,
  setTodoPeople,
  setTodoTags,
  toggleTodoDone,
  updateTodoField,
} from "@/app/(app)/todos/actions";
import { InlineText } from "@/components/plan/inline-text";
import { PillSelect } from "@/components/plan/pill-select";
import { InlineDate } from "@/components/todos/inline-date";
import { PeoplePicker } from "@/components/todos/people-picker";
import { TagsEditor } from "@/components/todos/tags-editor";
import { cn } from "@/lib/utils";
import type { TodoDTO } from "@/components/todos/types";

const PRIORITY_OPTIONS = [
  { id: "LOW", name: "Low", color: "#64748b" },
  { id: "MED", name: "Medium", color: "#f59e0b" },
  { id: "HIGH", name: "High", color: "#ef4444" },
];

export function TodoRow({
  todo,
  projects,
  allUsers,
}: {
  todo: TodoDTO;
  projects: { id: string; name: string }[];
  allUsers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  async function save(field: "title" | "notes" | "dueDate" | "priority" | "projectId", value: string) {
    await updateTodoField({ id: todo.id, field, value });
  }

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, color: "#2563eb" }));

  return (
    <div className={cn("card p-3.5 sm:p-4 transition-opacity", pending && "opacity-70")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => startTransition(() => toggleTodoDone(todo.id, !todo.done))}
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            todo.done ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)] hover:border-[var(--accent)]",
          )}
          aria-label={todo.done ? "Mark as not done" : "Mark as done"}
        >
          {todo.done && <span className="h-2 w-2 rounded-full bg-white" />}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <InlineText
            value={todo.title}
            onSave={(v) => save("title", v)}
            className={cn("font-medium", todo.done && "text-[var(--text-faint)] line-through")}
          />
          <InlineText
            value={todo.notes ?? ""}
            onSave={(v) => save("notes", v)}
            placeholder="+ add notes"
            multiline
            className="text-sm text-[var(--text-muted)]"
          />

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <PillSelect
              value={todo.priority ?? undefined}
              options={PRIORITY_OPTIONS}
              onChange={(v) => save("priority", v)}
              placeholder="Priority"
            />
            <InlineDate value={todo.dueDate} onSave={(v) => save("dueDate", v)} />
            {projectOptions.length > 0 && (
              <PillSelect
                value={todo.project?.id}
                options={projectOptions}
                onChange={(v) => save("projectId", v)}
                placeholder="Project"
              />
            )}
            {todo.project && projectOptions.length === 0 && (
              <span className="pill">
                <FolderKanban size={11} /> {todo.project.name}
              </span>
            )}
            <PeoplePicker
              people={todo.people}
              allUsers={allUsers}
              onChange={(ids) => setTodoPeople(todo.id, ids)}
            />
          </div>

          <TagsEditor tags={todo.tags} onChange={(tags) => setTodoTags(todo.id, tags)} />
        </div>

        <button
          type="button"
          onClick={() => deleteTodo(todo.id)}
          className="btn btn-ghost btn-icon btn-sm shrink-0 text-[var(--text-faint)] hover:!text-rose-600"
          aria-label="Delete todo"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

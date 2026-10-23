"use client";

import { useMemo, useState } from "react";
import { ListFilter } from "lucide-react";
import { TodoRow } from "@/components/todos/todo-row";
import { EmptyState } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { TodoDTO } from "@/components/todos/types";

type StatusFilter = "open" | "done" | "all";

export function TodoList({
  todos,
  projects,
  allUsers,
}: {
  todos: TodoDTO[];
  projects: { id: string; name: string }[];
  allUsers: { id: string; name: string }[];
}) {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [projectId, setProjectId] = useState("");
  const [personId, setPersonId] = useState("");
  const [tag, setTag] = useState("");

  const allTags = useMemo(() => Array.from(new Set(todos.flatMap((t) => t.tags))).sort(), [todos]);

  const filtered = todos.filter((t) => {
    if (status === "open" && t.done) return false;
    if (status === "done" && !t.done) return false;
    if (projectId && t.project?.id !== projectId) return false;
    if (personId && !t.people.some((p) => p.id === personId)) return false;
    if (tag && !t.tags.includes(tag)) return false;
    return true;
  });

  const hasFilters = projectId || personId || tag;

  return (
    <div className="flex flex-col gap-4">
      {/* Phones: the filters sit under the list, the status toggle on its own full-width row
          and the dropdowns sharing the row below it. */}
      <div className="order-last flex flex-wrap items-center gap-2 sm:order-none">
        <div className="glass flex w-full items-center gap-1 rounded-xl p-1 sm:inline-flex sm:w-auto">
          {(["open", "done", "all"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors sm:flex-none",
                status === s ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {projects.length > 0 && (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="select min-w-0 flex-1 text-sm sm:!w-auto sm:flex-none">
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <select value={personId} onChange={(e) => setPersonId(e.target.value)} className="select min-w-0 flex-1 text-sm sm:!w-auto sm:flex-none">
          <option value="">Everyone</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {allTags.length > 0 && (
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="select min-w-0 flex-1 text-sm sm:!w-auto sm:flex-none">
            <option value="">All labels</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setProjectId("");
              setPersonId("");
              setTag("");
            }}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text)]"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListFilter size={26} />}
          title={todos.length === 0 ? "No todos yet" : "Nothing matches these filters"}
          hint={todos.length === 0 ? "Add your first todo to get started." : "Try clearing a filter."}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <TodoRow key={t.id} todo={t} projects={projects} allUsers={allUsers} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CalendarRange, ChevronDown, FolderKanban, StickyNote, Trash2, Users } from "lucide-react";
import {
  deleteTodo,
  setTodoInPlan,
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
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { useFeedback } from "@/components/ui/feedback";
import { currentWeekStart, formatDayShort, weekKey } from "@/lib/week";
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
  const [, startTransition] = useTransition();
  // Ticks show instantly; the server catches up in the background (and reverts on failure).
  const [done, setDone] = useOptimistic(todo.done);
  const [planWeek, setPlanWeek] = useOptimistic(todo.planWeek);
  // Collapsed by default: just the todo itself; the editing controls open on demand.
  const [expanded, setExpanded] = useState(false);
  const { toast, confirm, deleteWithUndo, pendingDeletes } = useFeedback();

  function setDoneTo(next: boolean) {
    startTransition(async () => {
      setDone(next);
      await toggleTodoDone(todo.id, next);
    });
  }

  function toggle() {
    const next = !done;
    setDoneTo(next);
    if (next) toast({ message: "Marked done", action: { label: "Undo", onClick: () => setDoneTo(false) } });
  }

  async function togglePlan() {
    const next = !planWeek;
    if (!next && !(await confirm("Remove this todo from the weekly plan?", { confirmText: "Remove" }))) return;
    startTransition(async () => {
      setPlanWeek(next ? weekKey(currentWeekStart()) : null);
      await setTodoInPlan(todo.id, next);
      toast({ message: next ? "Added to this week's plan" : "Removed from the plan", tone: "success" });
    });
  }

  async function save(field: "title" | "notes" | "dueDate" | "priority" | "projectId", value: string) {
    await updateTodoField({ id: todo.id, field, value });
  }

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, color: "#2563eb" }));
  const priority = PRIORITY_OPTIONS.find((p) => p.id === todo.priority);
  const isThisWeek = planWeek === weekKey(currentWeekStart());

  if (pendingDeletes.has(todo.id)) return null;

  return (
    <div className="card px-3.5 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            done ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)] hover:border-[var(--accent)]",
          )}
          aria-label={done ? "Mark as not done" : "Mark as done"}
        >
          {done && <span className="h-2 w-2 rounded-full bg-white" />}
        </button>

        <div className="min-w-0 flex-1">
          <InlineText
            value={todo.title}
            onSave={(v) => save("title", v)}
            className={cn("font-medium", done && "text-[var(--text-faint)] line-through")}
          />

          {/* Collapsed: a quiet one-line summary of whatever is set — tap it to open the details. */}
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1 flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left text-xs text-[var(--text-faint)] empty:hidden"
            >
              {todo.dueDate && <DueText iso={todo.dueDate} done={done} />}
              {priority && <Pill color={priority.color}>{priority.name}</Pill>}
              {planWeek && (
                <span className="flex items-center gap-1 text-[var(--accent)]">
                  <CalendarRange size={12} /> {isThisWeek ? "This week's plan" : `Plan · ${formatDayShort(planWeek)}`}
                </span>
              )}
              {todo.project && (
                <span className="flex items-center gap-1">
                  <FolderKanban size={12} /> {todo.project.name}
                </span>
              )}
              {todo.people.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={12} /> {todo.people.length}
                </span>
              )}
              {todo.notes && <StickyNote size={12} aria-label="Has notes" />}
              {todo.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn btn-ghost btn-icon btn-sm -mr-1 shrink-0 text-[var(--text-faint)]"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide details" : "Show details"}
          title={expanded ? "Hide details" : "Edit details"}
        >
          <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="animate-in mt-3 space-y-3 border-t border-[var(--border)] pt-3 sm:ml-8">
          <InlineText
            value={todo.notes ?? ""}
            onSave={(v) => save("notes", v)}
            placeholder="+ add notes"
            multiline
            className="text-sm text-[var(--text-muted)]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <PillSelect
              value={todo.priority ?? undefined}
              options={PRIORITY_OPTIONS}
              onChange={(v) => save("priority", v)}
              placeholder="Priority"
            />
            <InlineDate value={todo.dueDate} onSave={(v) => save("dueDate", v)} done={done} />
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
            <PeoplePicker people={todo.people} allUsers={allUsers} onChange={(ids) => setTodoPeople(todo.id, ids)} />
          </div>

          <TagsEditor tags={todo.tags} onChange={(tags) => setTodoTags(todo.id, tags)} />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label
              className={cn(
                "flex items-center gap-2 text-sm text-[var(--text)]",
                todo.planFromTask ? "cursor-not-allowed opacity-70" : "cursor-pointer",
              )}
              title={todo.planFromTask ? "On the plan through its project task" : undefined}
            >
              <input
                type="checkbox"
                checked={!!planWeek}
                disabled={todo.planFromTask}
                onChange={togglePlan}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {planWeek && !isThisWeek ? `In the plan (week of ${formatDayShort(planWeek)})` : "Add to this week's plan"}
              {todo.planFromTask && <span className="text-xs text-[var(--text-faint)]">· from project</span>}
            </label>

            <button
              type="button"
              onClick={() => deleteWithUndo(todo.id, "Todo deleted", () => deleteTodo(todo.id))}
              className="btn btn-ghost btn-sm text-[var(--text-faint)] hover:!text-rose-600"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Read-only due date for the collapsed summary — green when done, red when overdue. */
function DueText({ iso, done }: { iso: string; done: boolean }) {
  const overdue = !done && new Date(iso) < new Date(new Date().toDateString());
  return (
    <span className={cn("font-medium", done ? "text-emerald-600" : overdue ? "text-rose-600" : "text-[var(--text-muted)]")}>
      {overdue ? "Overdue · " : "Due "}
      {new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
    </span>
  );
}

"use client";

import { Plus } from "lucide-react";
import { createTodoAction } from "@/app/(app)/todos/actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";

export function CreateTodoDialog({
  projects,
  allUsers,
}: {
  projects: { id: string; name: string }[];
  allUsers: { id: string; name: string }[];
}) {
  return (
    <FormDialog
      title="New todo"
      action={createTodoAction}
      submitText="Add todo"
      triggerLabel="New todo"
      triggerIcon={<Plus size={15} />}
      wide
    >
      <Field label="Title" htmlFor="title">
        <input id="title" name="title" className="input" placeholder="What needs doing?" autoFocus />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" rows={2} className="textarea" placeholder="Optional details…" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Due date" htmlFor="dueDate">
          <input id="dueDate" name="dueDate" type="date" className="input" />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" className="select" defaultValue="">
            <option value="">None</option>
            <option value="LOW">Low</option>
            <option value="MED">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </Field>
      </div>

      {projects.length > 0 && (
        <Field label="Project" htmlFor="projectId" hint="Optional — tag this todo to a project.">
          <select id="projectId" name="projectId" className="select" defaultValue="">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Tag people" hint="Optional.">
        <div className="flex flex-wrap gap-2">
          {allUsers.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-2 py-1 text-xs has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_10%,white)]"
            >
              <input type="checkbox" name="people" value={u.id} className="sr-only" />
              <Avatar name={u.name} size={18} />
              {u.name}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Labels" htmlFor="tags" hint="Comma-separated, e.g. urgent, hardware">
        <input id="tags" name="tags" className="input" placeholder="e.g. urgent, hardware" />
      </Field>
    </FormDialog>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createProjectAction } from "@/app/(app)/projects/actions";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";

export function CreateProjectDialog({ allUsers }: { allUsers: { id: string; name: string }[] }) {
  const [isPersonal, setIsPersonal] = useState(false);

  return (
    <FormDialog
      title="New project"
      action={createProjectAction}
      submitText="Create project"
      triggerLabel="New project"
      triggerIcon={<Plus size={15} />}
      wide
    >
      <Field label="Project name" htmlFor="name">
        <input id="name" name="projectName" className="input" placeholder="e.g. UPE BlockLine" autoFocus autoComplete="off" />
      </Field>
      <Field label="Description" htmlFor="description">
        <textarea id="description" name="description" rows={2} className="textarea" placeholder="What's this project about?" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-[var(--text)]">
        <input
          type="checkbox"
          name="isPersonal"
          checked={isPersonal}
          onChange={(e) => setIsPersonal(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Personal project (only visible to me)
      </label>

      {!isPersonal && allUsers.length > 0 && (
        <Field label="Assign teammates" hint="Optional — you can add more later.">
          <div className="flex flex-wrap gap-2">
            {allUsers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-2 py-1 text-xs has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_10%,white)]"
              >
                <input type="checkbox" name="members" value={u.id} className="sr-only" />
                <Avatar name={u.name} size={18} />
                {u.name}
              </label>
            ))}
          </div>
        </Field>
      )}
    </FormDialog>
  );
}

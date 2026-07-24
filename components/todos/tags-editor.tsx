"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

export function TagsEditor({
  tags,
  onChange,
  disabled = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    setDraft("");
    setAdding(false);
    if (t && !tags.includes(t)) onChange([...tags, t]);
  }

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="pill" style={{ ["--pc" as string]: "#64748b" }}>
          {t}
          {!disabled && (
            <button type="button" onClick={() => remove(t)} className="ml-0.5 -mr-1 rounded-full hover:opacity-70" aria-label={`Remove ${t}`}>
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {!disabled &&
        (adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="label…"
            className="input !w-24 !py-0.5 text-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-0.5 rounded-full border border-dashed border-[var(--border-strong)] px-2 py-0.5 text-xs text-[var(--text-faint)] hover:text-[var(--text)]"
          >
            <Plus size={11} /> label
          </button>
        ))}
    </div>
  );
}

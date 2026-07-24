"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createPlanItem } from "@/app/(app)/plan/actions";
import { PillSelect } from "@/components/plan/pill-select";
import type { PlanCategory, PlanStatusOpt } from "@/components/plan/types";

export function AddItemRow({
  ownerId,
  weekKey,
  categories,
  statuses,
  defaultStatusId,
  onAdded,
}: {
  ownerId: string;
  weekKey: string;
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  defaultStatusId?: string;
  onAdded?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subTag, setSubTag] = useState("");
  const [statusId, setStatusId] = useState(defaultStatusId ?? "");
  const [pending, startTransition] = useTransition();

  function submit() {
    const t = title.trim();
    if (!t) return;
    const fd = new FormData();
    fd.set("ownerId", ownerId);
    fd.set("weekStartDate", weekKey);
    fd.set("title", t);
    if (categoryId) fd.set("categoryId", categoryId);
    if (subTag.trim()) fd.set("subTag", subTag.trim());
    if (statusId) fd.set("statusId", statusId);
    startTransition(async () => {
      await createPlanItem(null, fd);
      setTitle("");
      setSubTag("");
      onAdded?.();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-2.5">
      <PillSelect
        value={categoryId || undefined}
        options={categories}
        onChange={(id) => setCategoryId(id)}
        placeholder="Category"
      />
      <input
        value={subTag}
        onChange={(e) => setSubTag(e.target.value)}
        placeholder="Tag"
        className="input !w-20 !py-1 text-sm"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add a task for this week…"
        className="input min-w-[180px] flex-1 !py-1 text-sm"
      />
      <PillSelect
        value={statusId || undefined}
        options={statuses}
        onChange={(id) => setStatusId(id)}
        placeholder="Status"
        allowClear={false}
      />
      <button type="button" className="btn btn-accent btn-sm" disabled={!title.trim() || pending} onClick={submit}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add
      </button>
    </div>
  );
}

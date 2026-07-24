"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Settings2, X } from "lucide-react";
import { createCategoryAction, createStatusAction } from "@/app/(app)/plan/board-settings-actions";
import { CategoryManager } from "@/components/plan/board-settings/category-manager";
import { StatusManager } from "@/components/plan/board-settings/status-manager";
import { CreateTagDialog } from "@/components/plan/board-settings/create-tag-dialog";
import { ColumnManager } from "@/components/plan/board-settings/column-manager";
import { AddColumnDialog } from "@/components/plan/board-settings/add-column-dialog";
import type { PlanCategory, PlanColumnDTO, PlanStatusOpt } from "@/components/plan/types";

export function TableSettingsDialog({
  ownerId,
  categories,
  statuses,
  columns,
  editable,
}: {
  ownerId: string;
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  columns: PlanColumnDTO[];
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted] = useState(() => typeof document !== "undefined");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
        <Settings2 size={14} />
        Table settings
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in" onClick={() => setOpen(false)} />
            <div className="card animate-in relative my-auto w-full max-w-lg" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-start justify-between gap-4 p-5 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Table settings</h2>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    {editable
                      ? "Your statuses, category tags, and custom columns — add, recolor, or remove them."
                      : "Statuses, category tags, and custom columns used on this board."}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-icon -mr-2 -mt-1" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto scroll-thin px-5 pb-5">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Statuses</h3>
                    {editable && (
                      <CreateTagDialog
                        ownerId={ownerId}
                        title="New status"
                        namePlaceholder="e.g. Blocked"
                        defaultColor="#64748b"
                        action={createStatusAction}
                        triggerLabel="Add status"
                      />
                    )}
                  </div>
                  <div className="card">
                    <StatusManager statuses={statuses} editable={editable} />
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Categories</h3>
                    {editable && (
                      <CreateTagDialog
                        ownerId={ownerId}
                        title="New category"
                        namePlaceholder="e.g. UPE BlockLine"
                        defaultColor="#2563eb"
                        action={createCategoryAction}
                        triggerLabel="Add category"
                      />
                    )}
                  </div>
                  <div className="card">
                    <CategoryManager categories={categories} editable={editable} />
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Custom columns</h3>
                    {editable && <AddColumnDialog ownerId={ownerId} />}
                  </div>
                  <div className="card">
                    <ColumnManager columns={columns} editable={editable} />
                  </div>
                </section>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

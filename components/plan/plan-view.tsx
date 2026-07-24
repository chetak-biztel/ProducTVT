"use client";

import { useState } from "react";
import Link from "next/link";
import { Table2, LayoutGrid, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanTable } from "@/components/plan/plan-table";
import { PlanBoard } from "@/components/plan/plan-board";
import { AddItemRow } from "@/components/plan/add-item-row";
import type { PlanCategory, PlanColumnDTO, PlanItemDTO, PlanStatusOpt } from "@/components/plan/types";

export function PlanView({
  ownerId,
  weekKey,
  items,
  categories,
  statuses,
  columns,
  columnsHref,
  editable,
  showReview = true,
}: {
  ownerId: string;
  weekKey: string;
  items: PlanItemDTO[];
  categories: PlanCategory[];
  statuses: PlanStatusOpt[];
  columns: PlanColumnDTO[];
  columnsHref: string;
  editable: boolean;
  showReview?: boolean;
}) {
  const [view, setView] = useState<"table" | "board">("table");
  const defaultStatusId = statuses.find((s) => s.isDefault)?.id ?? statuses[0]?.id;
  // Forces PlanBoard to remount (resetting its local drag state) whenever the
  // server's data actually changes, instead of syncing via an effect.
  const itemsKey = items.map((i) => `${i.id}:${i.status?.id}`).join(",");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="glass inline-flex items-center gap-1 rounded-xl p-1">
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              view === "table" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            <Table2 size={14} /> Table
          </button>
          <button
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              view === "board" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            <LayoutGrid size={14} /> Board
          </button>
        </div>

        <Link href={columnsHref} className="btn btn-outline btn-sm">
          <Columns3 size={14} />
          Edit Columns
        </Link>
      </div>

      {view === "table" ? (
        <PlanTable
          items={items}
          categories={categories}
          statuses={statuses}
          columns={columns}
          editable={editable}
          showReview={showReview}
        />
      ) : (
        <PlanBoard key={itemsKey} items={items} categories={categories} statuses={statuses} editable={editable} />
      )}

      {editable && (
        <AddItemRow
          ownerId={ownerId}
          weekKey={weekKey}
          categories={categories}
          statuses={statuses}
          columns={columns}
          defaultStatusId={defaultStatusId}
        />
      )}
    </div>
  );
}

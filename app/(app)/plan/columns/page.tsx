import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { getAllCategories, getPlanStatuses } from "@/lib/data/lookups";
import { getPlanColumns } from "@/lib/data/plan-columns";
import { PageHeader } from "@/components/page-header";
import { ColumnsList } from "@/components/plan/board-settings/columns-list";
import { AddColumnDialog } from "@/components/plan/board-settings/add-column-dialog";

export default async function PlanColumnsPage() {
  const user = await requireUser();
  const [categories, statuses, columns] = await Promise.all([
    getAllCategories(user.id),
    getPlanStatuses(user.id),
    getPlanColumns(user.id),
  ]);
  const columnsKey = columns.map((c) => `${c.id}:${c.order}:${c.hidden}:${c.name}`).join(",");

  return (
    <div>
      <Link href="/plan" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={14} /> Back to My Weekly Plan
      </Link>

      <PageHeader
        title="Edit Columns"
        subtitle="Every field on your weekly plan table — drag to reorder, rename, hide, or add your own."
      >
        <AddColumnDialog ownerId={user.id} />
      </PageHeader>

      <ColumnsList key={columnsKey} ownerId={user.id} categories={categories} statuses={statuses} columns={columns} editable />
    </div>
  );
}

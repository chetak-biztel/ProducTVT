import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getAllCategories, getPlanStatuses } from "@/lib/data/lookups";
import { getPlanColumns } from "@/lib/data/plan-columns";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ColumnsList } from "@/components/plan/board-settings/columns-list";
import { AddColumnDialog } from "@/components/plan/board-settings/add-column-dialog";

export default async function TeamMemberColumnsPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireManager();
  const { userId } = await params;

  const [member, categories, statuses, columns] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
    getAllCategories(userId),
    getPlanStatuses(userId),
    getPlanColumns(userId),
  ]);
  if (!member) notFound();
  const columnsKey = columns.map((c) => `${c.id}:${c.order}:${c.hidden}:${c.name}`).join(",");

  return (
    <div>
      <Link
        href={`/team/${member.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft size={14} /> Back to {member.name}&apos;s plan
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={member.name} size={30} />
            Edit {member.name}&apos;s columns
          </span>
        }
        subtitle="Every field on their weekly plan table — drag to reorder, rename, hide, or add your own."
      >
        <AddColumnDialog ownerId={member.id} />
      </PageHeader>

      <ColumnsList key={columnsKey} ownerId={member.id} categories={categories} statuses={statuses} columns={columns} editable />
    </div>
  );
}

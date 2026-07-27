import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getPlanItems, toPlanItemDTOs } from "@/lib/data/plan";
import { getCategories, getPlanStatuses } from "@/lib/data/lookups";
import { getPlanColumns } from "@/lib/data/plan-columns";
import { parseWeekKey, weekKey } from "@/lib/week";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { WeekSwitcher } from "@/components/plan/week-switcher";
import { PlanView } from "@/components/plan/plan-view";

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

export default async function TeamMemberPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  await requireManager();
  const { userId } = await params;
  const { week } = await searchParams;
  const weekStart = parseWeekKey(week);

  const [member, rawItems, categories, statuses, columns] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, active: true },
    }),
    getPlanItems(userId, weekStart),
    getCategories(userId),
    getPlanStatuses(userId),
    getPlanColumns(userId),
  ]);
  if (!member) notFound();
  const items = toPlanItemDTOs(rawItems);

  return (
    <div>
      <Link href="/team" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={14} /> Back to team
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={member.name} size={30} />
            {member.name}
          </span>
        }
        subtitle={`${roleLabel(member.role)} · weekly plan & remarks`}
      >
        <WeekSwitcher weekStartIso={weekStart.toISOString()} basePath={`/team/${member.id}`} ownerId={member.id} />
      </PageHeader>

      <PlanView
        ownerId={member.id}
        weekKey={weekKey(weekStart)}
        items={items}
        categories={categories}
        statuses={statuses}
        columns={columns}
        columnsHref={`/team/${member.id}/columns`}
        editable
      />
    </div>
  );
}

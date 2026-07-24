import { requireUser } from "@/lib/rbac";
import { getPlanItems, toPlanItemDTOs } from "@/lib/data/plan";
import { getCategories, getPlanStatuses } from "@/lib/data/lookups";
import { getPlanColumns } from "@/lib/data/plan-columns";
import { parseWeekKey, weekKey } from "@/lib/week";
import { PageHeader } from "@/components/page-header";
import { WeekSwitcher } from "@/components/plan/week-switcher";
import { PlanView } from "@/components/plan/plan-view";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireUser();
  const { week } = await searchParams;
  const weekStart = parseWeekKey(week);

  const [rawItems, categories, statuses, columns] = await Promise.all([
    getPlanItems(user.id, weekStart),
    getCategories(user.id),
    getPlanStatuses(user.id),
    getPlanColumns(user.id),
  ]);
  const items = toPlanItemDTOs(rawItems);

  return (
    <div>
      <PageHeader title="My Weekly Plan" subtitle="Plan your week, track status, and jot remarks as you go.">
        <WeekSwitcher weekStartIso={weekStart.toISOString()} basePath="/plan" />
      </PageHeader>

      <PlanView
        ownerId={user.id}
        weekKey={weekKey(weekStart)}
        items={items}
        categories={categories}
        statuses={statuses}
        columns={columns}
        columnsHref="/plan/columns"
        editable
      />
    </div>
  );
}

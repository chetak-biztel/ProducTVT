import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireManager } from "@/lib/rbac";
import { getActiveUsers } from "@/lib/data/lookups";
import { getTeamWeekCounts } from "@/lib/data/plan";
import { currentWeekStart, formatWeekRange, weekKey } from "@/lib/week";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Users } from "lucide-react";

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

export default async function TeamPage() {
  const user = await requireManager();
  const weekStart = currentWeekStart();

  const [users, counts] = await Promise.all([getActiveUsers(), getTeamWeekCounts(weekStart)]);
  const team = users.filter((u) => u.id !== user.id);

  return (
    <div>
      <PageHeader title="Team" subtitle={`This week's progress · ${formatWeekRange(weekStart)}`} />

      {team.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No teammates yet" hint="Create accounts for your team under Admin → Users." />
      ) : (
        <div className="card divide-y divide-[var(--border)]">
          {team.map((member) => {
            const c = counts.get(member.id) ?? { total: 0, done: 0 };
            const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <Link
                key={member.id}
                href={`/team/${member.id}?week=${weekKey(weekStart)}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,white)]"
              >
                <Avatar name={member.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--text)]">{member.name}</p>
                  <p className="truncate text-xs text-[var(--text-faint)]">{roleLabel(member.role)}</p>
                </div>
                <div className="hidden w-40 sm:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "var(--accent)" }}
                    />
                  </div>
                </div>
                <p className="w-20 shrink-0 text-right text-sm text-[var(--text-muted)]">
                  {c.done}/{c.total} done
                </p>
                <ChevronRight size={16} className="shrink-0 text-[var(--text-faint)]" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

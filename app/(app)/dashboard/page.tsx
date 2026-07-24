import Link from "next/link";
import { ArrowRight, CalendarRange, CheckSquare, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { getPlanItems } from "@/lib/data/plan";
import { getOpenTodoCount, getUpcomingTodos } from "@/lib/data/dashboard";
import { getProjectsForUser } from "@/lib/data/projects";
import { currentWeekStart, formatDayShort, formatWeekRange, weekKey } from "@/lib/week";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/page-header";
import { Pill } from "@/components/ui/pill";
import { ProjectCard } from "@/components/projects/project-card";
import type { ProjectListItemDTO } from "@/components/projects/types";

const PRIORITY_COLOR: Record<string, string> = { LOW: "#64748b", MED: "#f59e0b", HIGH: "#ef4444" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const weekStart = currentWeekStart();

  const [planItems, openTodoCount, upcomingTodos, projectsRaw] = await Promise.all([
    getPlanItems(user.id, weekStart),
    getOpenTodoCount(user.id),
    getUpcomingTodos(user.id, 5),
    getProjectsForUser(user.id),
  ]);
  const planSummary = { total: planItems.length, done: planItems.filter((i) => i.status?.name === "Done").length };

  const projects: ProjectListItemDTO[] = projectsRaw.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    isPersonal: p.isPersonal,
    members: p.members.map((m) => ({ id: m.id, role: m.role, user: m.user })),
    taskCounts: { total: p.tasks.length, done: p.tasks.filter((t) => t.status === "DONE").length },
  }));

  const activeProjectCount = projectsRaw.filter((p) => p.status === "ACTIVE").length;
  const openPlanItems = planItems.filter((i) => i.status?.name !== "Done").slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{formatWeekRange(weekStart)} · here&apos;s where things stand.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarRange}
          label="Tasks done this week"
          value={`${planSummary.done}/${planSummary.total}`}
          href={`/plan?week=${weekKey(weekStart)}`}
        />
        <StatCard icon={CheckSquare} label="Open todos" value={String(openTodoCount)} href="/todos" />
        <StatCard icon={FolderKanban} label="Active projects" value={String(activeProjectCount)} href="/projects" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">This week&apos;s plan</h2>
            <Link href={`/plan?week=${weekKey(weekStart)}`} className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
              Open plan <ArrowRight size={12} />
            </Link>
          </div>
          {openPlanItems.length === 0 ? (
            <EmptyState title="Nothing pending" hint="Everything's done, or your week is still empty." />
          ) : (
            <ul className="space-y-2.5">
              {openPlanItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  {item.category && <Pill color={item.category.color}>{item.category.name}</Pill>}
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{item.title}</span>
                  {item.status && <Pill color={item.status.color}>{item.status.name}</Pill>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">Upcoming todos</h2>
            <Link href="/todos" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
              Open todos <ArrowRight size={12} />
            </Link>
          </div>
          {upcomingTodos.length === 0 ? (
            <EmptyState title="No open todos" hint="You're all caught up." />
          ) : (
            <ul className="space-y-2.5">
              {upcomingTodos.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{t.title}</span>
                  {t.priority && <Pill color={PRIORITY_COLOR[t.priority]}>{t.priority}</Pill>}
                  {t.dueDate && <span className="shrink-0 text-xs text-[var(--text-faint)]">{formatDayShort(t.dueDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text)]">Your projects</h2>
          <Link href="/projects" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState icon={<FolderKanban size={26} />} title="No projects yet" hint="Create one from the Projects page." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

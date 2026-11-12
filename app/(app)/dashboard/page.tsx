import Link from "next/link";
import { ArrowRight, CheckSquare, AlertCircle, NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { loadDay } from "@/lib/day";
import { getOpenTodoCount, getOverdueTodoCount, getUpcomingTodos } from "@/lib/data/dashboard";
import { formatDayShort } from "@/lib/week";
import { StatCard } from "@/components/dashboard/stat-card";
import { DaySummary, UpcomingReminders, type DayData, type Reminder } from "@/components/dashboard/day-summary";
import { EmptyState } from "@/components/page-header";
import { Pill } from "@/components/ui/pill";

const PRIORITY_COLOR: Record<string, string> = { LOW: "#64748b", MED: "#f59e0b", HIGH: "#ef4444" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [openTodos, overdue, upcoming, notes, noteCount, day] = await Promise.all([
    getOpenTodoCount(user.id),
    getOverdueTodoCount(user.id),
    getUpcomingTodos(user.id, 6),
    prisma.note.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, take: 4, select: { id: true, title: true, content: true } }),
    prisma.note.count({ where: { ownerId: user.id } }),
    loadDay(user.id),
  ]);

  // Only the last two days go to the browser; "today" is worked out there, in the viewer's time zone.
  const since = Date.now() - 2 * 86_400_000;
  const recent = (l: unknown) => ((l as DayData["entries"]) ?? []).filter((e) => e.end >= since);
  const d = day.data as Record<string, unknown>;
  const dayData: DayData = {
    entries: recent(d.entries),
    autoEntries: recent(d.autoEntries),
    active: (d.active as DayData["active"]) ?? null,
    auto: (d.auto as DayData["auto"]) ?? null,
    goals: (d.goals as DayData["goals"]) ?? {},
  };
  const reminders = ((d.reminders as Reminder[]) ?? []).slice(0, 50);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-[var(--text)]">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Here&apos;s where today stands.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={CheckSquare} label="Open todos" value={String(openTodos)} href="/todos" />
        <StatCard icon={AlertCircle} label="Overdue" value={String(overdue)} href="/todos" />
        <StatCard icon={NotebookPen} label="Notes" value={String(noteCount)} href="/notes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DaySummary data={dayData} />

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">Upcoming todos</h2>
            <Link href="/todos" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
              Open todos <ArrowRight size={12} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="No open todos" hint="You're all caught up." />
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{t.title}</span>
                  {t.priority && <Pill color={PRIORITY_COLOR[t.priority]}>{t.priority}</Pill>}
                  {t.dueDate && <span className="shrink-0 text-xs text-[var(--text-faint)]">{formatDayShort(t.dueDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <UpcomingReminders reminders={reminders} />

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">Recent notes</h2>
            <Link href="/notes" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
              Open notepad <ArrowRight size={12} />
            </Link>
          </div>
          {notes.length === 0 ? (
            <EmptyState title="No notes yet" hint="Jot something down in the Notepad." />
          ) : (
            <ul className="space-y-2.5">
              {notes.map((n) => (
                <li key={n.id} className="min-w-0">
                  <Link href="/notes" className="block truncate text-sm text-[var(--text)] hover:text-[var(--accent)]">{n.title}</Link>
                  <p className="truncate text-xs text-[var(--text-faint)]">{n.content.slice(0, 80) || "Empty"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

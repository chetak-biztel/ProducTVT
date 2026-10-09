"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, CopyPlus, Loader2 } from "lucide-react";
import { addWeeks, currentWeekStart, formatWeekRange, weekKey } from "@/lib/week";
import { copyPreviousWeekPlan } from "@/app/(app)/plan/actions";

export function WeekSwitcher({
  weekStartIso,
  basePath = "/plan",
  ownerId,
}: {
  weekStartIso: string;
  basePath?: string;
  ownerId?: string;
}) {
  const router = useRouter();
  const [copying, startCopy] = useTransition();
  const weekStart = new Date(weekStartIso);
  const isCurrent = weekKey(weekStart) === weekKey(currentWeekStart());

  function go(next: Date) {
    router.push(`${basePath}?week=${weekKey(next)}`);
  }

  function copyLastWeek() {
    if (!ownerId) return;
    if (!window.confirm("Copy every task from last week into this week?")) return;
    startCopy(async () => {
      try {
        await copyPreviousWeekPlan(ownerId, weekKey(weekStart));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Couldn't copy last week's tasks.");
      }
    });
  }

  return (
    <div className="glass flex w-full items-center gap-1 rounded-xl p-1 sm:inline-flex sm:w-auto">
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => go(addWeeks(weekStart, -1))} aria-label="Previous week">
        <ChevronLeft size={16} />
      </button>
      <div className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-1 text-sm font-medium text-[var(--text)] sm:flex-none sm:px-2">
        <CalendarDays size={14} className="hidden text-[var(--text-faint)] sm:block" />
        {formatWeekRange(weekStart)}
      </div>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => go(addWeeks(weekStart, 1))} aria-label="Next week">
        <ChevronRight size={16} />
      </button>
      {!isCurrent && (
        <button className="btn btn-outline btn-sm ml-1" onClick={() => go(currentWeekStart())}>
          This week
        </button>
      )}
      {isCurrent && ownerId && (
        <button className="btn btn-outline btn-sm ml-1" onClick={copyLastWeek} disabled={copying} title="Copy last week">
          {copying ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />}
          <span className="hidden sm:inline">Copy last week</span>
        </button>
      )}
    </div>
  );
}

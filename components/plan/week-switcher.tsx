"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addWeeks, currentWeekStart, formatWeekRange, weekKey } from "@/lib/week";

export function WeekSwitcher({ weekStartIso, basePath = "/plan" }: { weekStartIso: string; basePath?: string }) {
  const router = useRouter();
  const weekStart = new Date(weekStartIso);
  const isCurrent = weekKey(weekStart) === weekKey(currentWeekStart());

  function go(next: Date) {
    router.push(`${basePath}?week=${weekKey(next)}`);
  }

  return (
    <div className="glass inline-flex items-center gap-1 rounded-xl p-1">
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => go(addWeeks(weekStart, -1))} aria-label="Previous week">
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-1.5 px-2 text-sm font-medium text-[var(--text)]">
        <CalendarDays size={14} className="text-[var(--text-faint)]" />
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
    </div>
  );
}

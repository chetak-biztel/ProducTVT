"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Span = { cat: string; start: number; end: number };
export type DayData = {
  entries: Span[];
  autoEntries: Span[];
  active: { cat: string; start: number } | null;
  auto: { cat: string; start: number; last: number } | null;
  goals: Record<string, { mins: number; kind: "min" | "max" }>;
};

const CATS = [
  { id: "work", label: "Work", color: "var(--accent)" },
  { id: "study", label: "Study", color: "#7c3aed" },
  { id: "fun", label: "Entertainment", color: "#be123c" },
  { id: "workout", label: "Workout", color: "#65a30d" },
  { id: "break", label: "Break", color: "#a16207" },
];
const MIN = 60000;
const fmt = (ms: number) => {
  const m = Math.round(ms / MIN);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
};

/** Totals are computed here, in the browser, because "today" is the viewer's day, not the server's. */
export function dayTotals(d: DayData, now: number) {
  const t0 = new Date(now).setHours(0, 0, 0, 0);
  const t1 = t0 + 86_400_000;
  const totals: Record<string, number> = {};
  const spans: Span[] = [...d.entries, ...d.autoEntries];
  if (d.active) spans.push({ ...d.active, end: now });
  if (d.auto) spans.push({ cat: d.auto.cat, start: d.auto.start, end: now - d.auto.last <= 40_000 ? now : d.auto.last });
  for (const s of spans) totals[s.cat] = (totals[s.cat] ?? 0) + Math.max(0, Math.min(s.end, t1) - Math.max(s.start, t0));
  return totals;
}

export function DaySummary({ data }: { data: DayData }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);
  if (now === null) return <div className="h-40" />;
  const totals = dayTotals(data, now);
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const live = data.active ?? (data.auto && now - data.auto.last <= 40_000 ? data.auto : null);
  const liveCat = CATS.find((c) => c.id === live?.cat);

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text)]">
          Today <span className="ml-1 font-normal text-[var(--text-muted)]">· {fmt(sum)} tracked</span>
        </h2>
        <Link href="/day" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
          Open Day Tracker <ArrowRight size={12} />
        </Link>
      </div>
      {liveCat && live && (
        <p className="mb-4 rounded-xl bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: liveCat.color }} />
          {liveCat.label} running for {fmt(now - live.start)}
        </p>
      )}
      <ul className="space-y-3">
        {CATS.map((c) => {
          const ms = totals[c.id] ?? 0;
          const g = data.goals[c.id];
          const goal = g?.mins ? g.mins * MIN : 0;
          const over = g?.kind === "max" && goal > 0 && ms > goal;
          const pct = goal ? Math.min(100, (ms / goal) * 100) : sum ? (ms / sum) * 100 : 0;
          return (
            <li key={c.id}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-[var(--text)]">{c.label}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {fmt(ms)}
                  {goal ? ` / ${g.kind === "max" ? "max " : ""}${fmt(goal)}` : ""}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-2)]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? "var(--danger)" : c.color }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export type Reminder = { id: string; text: string; at: number; fired: boolean };

export function UpcomingReminders({ reminders }: { reminders: Reminder[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const list = reminders.filter((r) => !r.fired && (now === null || r.at > now - 60_000)).sort((a, b) => a.at - b.at).slice(0, 5);
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text)]">Reminders</h2>
        <Link href="/day" className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
          Manage <ArrowRight size={12} />
        </Link>
      </div>
      {now === null || list.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{now === null ? "" : "No reminders set."}</p>
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="flex items-center gap-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{r.text}</span>
              <span className="shrink-0 text-xs text-[var(--text-faint)]">
                {new Date(r.at).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

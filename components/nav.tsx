"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/actions/session";
import { cn } from "@/lib/utils";
import { NAV_ICONS, TAB_BAR_LINKS, buildLinks } from "@/components/nav-links";
import { useAppShell } from "@/components/app-shell";

type NavUser = { name: string; username: string; role: string };

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

const SIDEBAR_COOKIE = "sidebar";

export function Nav({
  user,
  initialCollapsed = false,
  overdueCount = 0,
}: {
  user: NavUser;
  initialCollapsed?: boolean;
  /** Open todos past their due date — shown as a badge on Todos. */
  overdueCount?: number;
}) {
  const pathname = usePathname();
  const { openSearch } = useAppShell();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const links = buildLinks(user.role);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  // `compact` = desktop sidebar collapsed to icons only; the mobile drawer is always full.
  const navLinks = (compact: boolean) => (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const Icon = NAV_ICONS[l.icon];
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            title={compact ? l.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-colors",
              compact ? "justify-center px-2" : "px-3",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--tint))] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--accent)_7%,var(--tint))] hover:text-[var(--text)]",
            )}
          >
            <span className="relative shrink-0">
              <Icon size={18} />
              {compact && l.href === "/todos" && overdueCount > 0 && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-600" />
              )}
            </span>
            {!compact && <span className="min-w-0 flex-1 truncate">{l.label}</span>}
            {!compact && l.href === "/todos" && overdueCount > 0 && <OverdueBadge count={overdueCount} />}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (compact: boolean) => (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5", compact ? "justify-center" : "px-1")}
      onClick={() => setOpen(false)}
      title={compact ? "ProducTVT" : undefined}
    >
      <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-xl" priority />
      {!compact && <span className="font-semibold tracking-tight text-[var(--text)]">ProducTVT</span>}
    </Link>
  );

  const signOut = (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-ghost btn-icon" title="Sign out">
        <LogOut size={17} />
      </button>
    </form>
  );

  const footer = (compact: boolean) => (
    <div className="mt-auto pt-3">
      {compact ? (
        <div className="flex flex-col items-center gap-1 py-2">
          <ThemeToggle />
          {signOut}
          <div className="mt-1" title={`${user.name} · ${roleLabel(user.role)}`}>
            <Avatar name={user.name} size={32} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--text-faint)]">{roleLabel(user.role)}</p>
          </div>
          <ThemeToggle />
          {signOut}
        </div>
      )}
    </div>
  );

  const searchButton = (compact: boolean) =>
    compact ? (
      <button type="button" className="btn btn-ghost btn-icon mx-auto" onClick={openSearch} title="Search (Ctrl K)" aria-label="Search">
        <Search size={18} />
      </button>
    ) : (
      <button
        type="button"
        onClick={openSearch}
        className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-faint)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-muted)]"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-[var(--border-strong)] px-1.5 text-[10px]">Ctrl K</kbd>
      </button>
    );

  const collapseButton = (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      onClick={toggleCollapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden">
        {brand(false)}
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-icon" onClick={openSearch} aria-label="Search">
            <Search size={19} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Phone bottom tab bar */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        {TAB_BAR_LINKS.map((l) => {
          const Icon = NAV_ICONS[l.icon];
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium",
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
              )}
            >
              <span className="relative">
                <Icon size={21} />
                {l.href === "/todos" && overdueCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] leading-4 text-white">
                    {overdueCount > 9 ? "9+" : overdueCount}
                  </span>
                )}
              </span>
              {l.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium text-[var(--text-muted)]"
        >
          <MoreHorizontal size={21} />
          More
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="glass animate-in absolute left-0 top-0 flex h-full w-72 flex-col gap-4 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              {brand(false)}
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {navLinks(false)}
            {footer(false)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "glass sticky top-0 hidden h-screen shrink-0 flex-col gap-5 overflow-hidden py-4 transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px] px-3" : "w-64 px-4",
        )}
      >
        <div className={cn("flex items-center pt-2", collapsed ? "flex-col gap-3" : "justify-between")}>
          {brand(collapsed)}
          {collapseButton}
        </div>
        {searchButton(collapsed)}
        {navLinks(collapsed)}
        {footer(collapsed)}
      </aside>
    </>
  );
}

function OverdueBadge({ count }: { count: number }) {
  return (
    <span
      className="rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold leading-5 text-white"
      title={`${count} overdue`}
    >
      {count}
    </span>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  FolderKanban,
  NotebookPen,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/actions/session";
import { cn } from "@/lib/utils";

type NavUser = { name: string; username: string; role: string };

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  plan: CalendarRange,
  todos: CheckSquare,
  projects: FolderKanban,
  notes: NotebookPen,
  team: Users,
  admin: ShieldCheck,
  settings: Settings,
};

function buildLinks(role: string) {
  const isManager = role === "FOUNDER" || role === "MANAGER";
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/plan", label: "My Weekly Plan", icon: "plan" },
    { href: "/todos", label: "Todos", icon: "todos" },
    { href: "/notes", label: "Notepad", icon: "notes" },
    { href: "/projects", label: "Projects", icon: "projects" },
  ];
  if (isManager) {
    links.push({ href: "/team", label: "Team", icon: "team" });
    links.push({ href: "/admin", label: "Admin", icon: "admin" });
  }
  links.push({ href: "/settings", label: "Settings", icon: "settings" });
  return links;
}

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

const SIDEBAR_COOKIE = "sidebar";

export function Nav({ user, initialCollapsed = false }: { user: NavUser; initialCollapsed?: boolean }) {
  const pathname = usePathname();
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
        const Icon = ICONS[l.icon];
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
            <Icon size={18} className="shrink-0" />
            {!compact && l.label}
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
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        {brand(false)}
        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="glass animate-in absolute left-0 top-0 flex h-full w-72 flex-col gap-4 p-4">
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
        {navLinks(collapsed)}
        {footer(collapsed)}
      </aside>
    </>
  );
}

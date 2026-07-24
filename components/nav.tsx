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
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/lib/actions/session";
import { cn } from "@/lib/utils";

type NavUser = { name: string; username: string; role: string };

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  plan: CalendarRange,
  todos: CheckSquare,
  projects: FolderKanban,
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

export function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = buildLinks(user.role);

  const NavLinks = (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const Icon = ICONS[l.icon];
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_12%,white)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--accent)_7%,white)] hover:text-[var(--text)]",
            )}
          >
            <Icon size={18} className="shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const Brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-1" onClick={() => setOpen(false)}>
      <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-xl" priority />
      <span className="font-semibold tracking-tight text-[var(--text)]">ProducTVT</span>
    </Link>
  );

  const Footer = (
    <div className="mt-auto pt-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <Avatar name={user.name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text)]">{user.name}</p>
          <p className="truncate text-xs text-[var(--text-faint)]">{roleLabel(user.role)}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn btn-ghost btn-icon" title="Sign out">
            <LogOut size={17} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        {Brand}
        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="glass animate-in absolute left-0 top-0 flex h-full w-72 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              {Brand}
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {NavLinks}
            {Footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-screen w-64 flex-col gap-5 p-4 md:flex">
        <div className="pt-2">{Brand}</div>
        {NavLinks}
        {Footer}
      </aside>
    </>
  );
}

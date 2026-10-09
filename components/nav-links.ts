import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  FolderKanban,
  NotebookPen,
  Users,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  plan: CalendarRange,
  todos: CheckSquare,
  projects: FolderKanban,
  notes: NotebookPen,
  team: Users,
  admin: ShieldCheck,
  settings: Settings,
};

export function buildLinks(role: string) {
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

/** The phone bottom tab bar's fixed tabs; everything else lives behind "More". */
export const TAB_BAR_LINKS = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/plan", label: "Plan", icon: "plan" },
  { href: "/todos", label: "Todos", icon: "todos" },
  { href: "/projects", label: "Projects", icon: "projects" },
];

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/config", label: "Appearance" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="glass inline-flex items-center gap-1 rounded-xl p-1">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

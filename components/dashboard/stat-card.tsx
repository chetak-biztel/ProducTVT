import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link href={href} className="card card-hover flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl accent-soft">
          <Icon size={17} />
        </span>
        <ArrowRight size={15} className="text-[var(--text-faint)]" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{hint}</p>}
      </div>
    </Link>
  );
}

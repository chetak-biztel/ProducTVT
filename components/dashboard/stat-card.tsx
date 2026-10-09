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
    <Link href={href} className="card card-hover flex flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-xl accent-soft sm:h-9 sm:w-9">
          <Icon size={17} />
        </span>
        <ArrowRight size={15} className="hidden text-[var(--text-faint)] sm:block" />
      </div>
      <div>
        <p className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{value}</p>
        <p className="text-xs leading-snug text-[var(--text-muted)] sm:text-sm">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{hint}</p>}
      </div>
    </Link>
  );
}

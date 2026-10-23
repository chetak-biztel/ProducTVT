import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireManager();
  return (
    <div>
      <PageHeader title="Admin">
        <Link href="/settings" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          Account settings →
        </Link>
      </PageHeader>
      <AdminTabs />
      <div className="mt-5">{children}</div>
    </div>
  );
}

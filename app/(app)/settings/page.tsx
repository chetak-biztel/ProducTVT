import { requireUser } from "@/lib/rbac";
import { getAccentColor } from "@/lib/theme";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { AppearanceForm } from "@/components/settings/appearance-form";

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [record, workspaceDefault] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { accentColor: true } }),
    getAccentColor(),
  ]);

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle="Manage your account." />

      <div className="card mb-6 flex items-center gap-4 p-5">
        <Avatar name={user.name} size={44} />
        <div>
          <p className="font-medium text-[var(--text)]">{user.name}</p>
          <p className="text-sm text-[var(--text-faint)]">
            @{user.username} · {roleLabel(user.role)}
          </p>
        </div>
      </div>

      <div className="card mb-6 p-5">
        <h2 className="font-semibold text-[var(--text)]">Appearance</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pick the accent color used across buttons, links and highlights on your pages.
        </p>
        <div className="mt-4">
          <AppearanceForm current={record?.accentColor ?? workspaceDefault} hasOverride={!!record?.accentColor} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-[var(--text)]">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

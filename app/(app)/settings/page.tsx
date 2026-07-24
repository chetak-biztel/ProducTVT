import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

function roleLabel(role: string) {
  return role === "FOUNDER" ? "Founder" : role === "MANAGER" ? "Manager" : "Employee";
}

export default async function SettingsPage() {
  const user = await requireUser();

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

      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-[var(--text)]">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

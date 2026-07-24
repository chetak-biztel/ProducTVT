import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { RoleSelect, ActiveToggle } from "@/components/admin/user-row-controls";

export default async function AdminUsersPage() {
  const me = await requireManager();
  const users = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateUserDialog />
      </div>

      <div className="card overflow-x-auto scroll-thin">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Username</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Active</th>
              <th className="w-16 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.id;
              return (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size={30} />
                      <span className={u.active ? "text-[var(--text)]" : "text-[var(--text-faint)]"}>
                        {u.name}
                        {self && <span className="ml-1.5 text-xs text-[var(--text-faint)]">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{u.username}</td>
                  <td className="px-4 py-2.5">
                    <RoleSelect userId={u.id} role={u.role} disabled={self} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ActiveToggle userId={u.id} active={u.active} disabled={self} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ResetPasswordDialog userId={u.id} name={u.name} />
                      <DeleteUserButton userId={u.id} name={u.name} disabled={self} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

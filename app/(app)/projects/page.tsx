import { requireUser } from "@/lib/rbac";
import { getProjectsForUser } from "@/lib/data/projects";
import { getActiveUsers } from "@/lib/data/lookups";
import { PageHeader, EmptyState } from "@/components/page-header";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { FolderKanban } from "lucide-react";
import type { ProjectListItemDTO } from "@/components/projects/types";

export default async function ProjectsPage() {
  const user = await requireUser();
  const [raw, users] = await Promise.all([getProjectsForUser(user.id), getActiveUsers()]);

  const projects: ProjectListItemDTO[] = raw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    isPersonal: p.isPersonal,
    members: p.members.map((m) => ({ id: m.id, role: m.role, user: m.user })),
    taskCounts: {
      total: p.tasks.length,
      done: p.tasks.filter((t) => t.status === "DONE").length,
    },
  }));

  const team = projects.filter((p) => !p.isPersonal);
  const personal = projects.filter((p) => p.isPersonal);
  const allUsers = users.filter((u) => u.id !== user.id).map((u) => ({ id: u.id, name: u.name }));

  return (
    <div className="space-y-8">
      <PageHeader title="Projects" subtitle="Team projects and your own personal work, organized by section.">
        <CreateProjectDialog allUsers={allUsers} />
      </PageHeader>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-faint)]">Team projects</h2>
        {team.length === 0 ? (
          <EmptyState icon={<FolderKanban size={26} />} title="No team projects yet" hint="Create one and assign teammates to get started." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-faint)]">Personal projects</h2>
        {personal.length === 0 ? (
          <EmptyState icon={<FolderKanban size={26} />} title="No personal projects yet" hint="Use these for your own work, outside the team." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personal.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

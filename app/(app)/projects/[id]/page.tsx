import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { canAccessProject, getProjectDetail } from "@/lib/data/projects";
import { getActiveUsers } from "@/lib/data/lookups";
import { ProjectHeader } from "@/components/projects/project-header";
import { MembersPanel } from "@/components/projects/members-panel";
import { SectionTabs } from "@/components/projects/section-tabs";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [allowed, users] = await Promise.all([canAccessProject(id, user.id), getActiveUsers()]);
  if (!allowed) notFound();

  const project = await getProjectDetail(id);
  if (!project) notFound();

  const isOwner = project.members.some((m) => m.user.id === user.id && m.role === "OWNER");
  const memberOptions = project.members.map((m) => ({ id: m.user.id, name: m.user.name }));
  const candidates = users.filter((u) => u.id !== user.id).map((u) => ({ id: u.id, name: u.name }));

  const sections = project.sections.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    tasks: s.tasks,
    updates: s.updates.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
  }));

  return (
    <div className="space-y-5">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={14} /> Back to projects
      </Link>

      <ProjectHeader projectId={project.id} name={project.name} description={project.description} status={project.status} />

      {!project.isPersonal && (
        <MembersPanel
          projectId={project.id}
          members={project.members.map((m) => ({ id: m.id, role: m.role, user: m.user }))}
          candidates={candidates}
          isOwner={isOwner}
        />
      )}

      <SectionTabs
        projectId={project.id}
        sections={sections}
        members={memberOptions}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </div>
  );
}

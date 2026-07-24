import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import type { ProjectListItemDTO } from "@/components/projects/types";

export function ProjectCard({ project }: { project: ProjectListItemDTO }) {
  const { total, done } = project.taskCounts;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`} className="card card-hover flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[var(--text)]">{project.name}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{project.description}</p>
      )}

      <div className="mt-auto space-y-2 pt-1">
        {total > 0 && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-2)]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
            </div>
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              {done}/{total} tasks done
            </p>
          </div>
        )}

        {!project.isPersonal && (
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((m) => (
              <span key={m.id} className="ring-2 ring-[var(--surface)] rounded-full">
                <Avatar name={m.user.name} size={24} />
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

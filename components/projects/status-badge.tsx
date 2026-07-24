import { Pill } from "@/components/ui/pill";
import type { ProjectStatusV, TaskStatusV } from "@/components/projects/types";

const PROJECT_STATUS: Record<ProjectStatusV, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#16a34a" },
  ON_HOLD: { label: "On hold", color: "#f59e0b" },
  COMPLETED: { label: "Completed", color: "#2563eb" },
  ARCHIVED: { label: "Archived", color: "#64748b" },
};

export const TASK_STATUS_OPTIONS: { id: TaskStatusV; name: string; color: string }[] = [
  { id: "TODO", name: "To do", color: "#64748b" },
  { id: "DOING", name: "Doing", color: "#3b82f6" },
  { id: "DONE", name: "Done", color: "#16a34a" },
];

export function ProjectStatusBadge({ status }: { status: ProjectStatusV }) {
  const s = PROJECT_STATUS[status];
  return <Pill color={s.color}>{s.label}</Pill>;
}

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS).map(([id, v]) => ({ id, ...v }));

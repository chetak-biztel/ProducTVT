import { prisma } from "@/lib/db";

export async function getProjectsForUser(userId: string) {
  const projects = await prisma.project.findMany({
    where: { OR: [{ createdById: userId }, { members: { some: { userId } } }] },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return projects;
}

export async function canAccessProject(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true, members: { select: { userId: true } } },
  });
  if (!project) return false;
  return project.createdById === userId || project.members.some((m) => m.userId === userId);
}

export async function getProjectDetail(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true } } }, orderBy: { addedAt: "asc" } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            include: { assignee: { select: { id: true, name: true } } },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
}

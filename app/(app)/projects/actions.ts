"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { canAccessProject } from "@/lib/data/projects";
import { fail, ok, type ActionState } from "@/lib/actions/types";

const DEFAULT_SECTIONS: { name: string; type: "HARDWARE" | "SOFTWARE" | "PROJECT_MGMT" }[] = [
  { name: "Hardware", type: "HARDWARE" },
  { name: "Software", type: "SOFTWARE" },
  { name: "Project Management", type: "PROJECT_MGMT" },
];

async function assertMember(projectId: string, userId: string) {
  const allowed = await canAccessProject(projectId, userId);
  if (!allowed) throw new Error("Not authorized");
}

async function assertOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { createdById: true } });
  if (!project || project.createdById !== userId) throw new Error("Only the project owner can do this");
}

function revalidateProject(id: string) {
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

// ---------- Project ----------

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  isPersonal: z.string().optional(),
});

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isPersonal: formData.get("isPersonal") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const isPersonal = parsed.data.isPersonal === "on";
  const memberIds = isPersonal ? [] : formData.getAll("members").map(String).filter((id) => id !== user.id);

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isPersonal,
      createdById: user.id,
      members: {
        create: [
          { userId: user.id, role: "OWNER" },
          ...memberIds.map((userId) => ({ userId, role: "MEMBER" as const })),
        ],
      },
      sections: { create: DEFAULT_SECTIONS.map((s, i) => ({ ...s, order: i })) },
    },
  });

  revalidateProject(project.id);
  return ok;
}

const fieldSchema = z.object({
  projectId: z.string().min(1),
  field: z.enum(["name", "description"]),
  value: z.string(),
});

export async function updateProjectField(input: { projectId: string; field: string; value: string }) {
  const user = await requireUser();
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");
  await assertMember(parsed.data.projectId, user.id);

  if (parsed.data.field === "name") {
    const name = parsed.data.value.trim();
    if (!name) throw new Error("Name cannot be empty");
    await prisma.project.update({ where: { id: parsed.data.projectId }, data: { name } });
  } else {
    await prisma.project.update({
      where: { id: parsed.data.projectId },
      data: { description: parsed.data.value.trim() || null },
    });
  }
  revalidateProject(parsed.data.projectId);
}

export async function setProjectStatus(projectId: string, status: string) {
  const user = await requireUser();
  await assertMember(projectId, user.id);
  const valid = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  await prisma.project.update({ where: { id: projectId }, data: { status: status as never } });
  revalidateProject(projectId);
}

// ---------- Members ----------

export async function addMember(projectId: string, userId: string) {
  const user = await requireUser();
  await assertOwner(projectId, user.id);
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: {},
    create: { projectId, userId, role: "MEMBER" },
  });
  revalidateProject(projectId);
}

export async function removeMember(projectId: string, userId: string) {
  const user = await requireUser();
  await assertOwner(projectId, user.id);
  if (userId === user.id) throw new Error("You can't remove yourself as owner");
  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  revalidateProject(projectId);
}

// ---------- Sections ----------

const sectionSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  type: z.enum(["HARDWARE", "SOFTWARE", "PROJECT_MGMT", "OTHER"]),
});

export async function createSectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = sectionSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await assertMember(parsed.data.projectId, user.id);

  const last = await prisma.projectSection.findFirst({
    where: { projectId: parsed.data.projectId },
    orderBy: { order: "desc" },
  });
  await prisma.projectSection.create({
    data: { ...parsed.data, order: (last?.order ?? -1) + 1 },
  });
  revalidateProject(parsed.data.projectId);
  return ok;
}

export async function deleteSectionAction(sectionId: string, projectId: string) {
  const user = await requireUser();
  await assertOwner(projectId, user.id);
  await prisma.projectSection.delete({ where: { id: sectionId } });
  revalidateProject(projectId);
}

// ---------- Tasks ----------

const taskSchema = z.object({
  projectId: z.string().min(1),
  sectionId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(300),
  assigneeId: z.string().optional(),
});

export async function createTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    sectionId: formData.get("sectionId"),
    title: formData.get("title"),
    assigneeId: formData.get("assigneeId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await assertMember(parsed.data.projectId, user.id);

  const last = await prisma.projectTask.findFirst({
    where: { sectionId: parsed.data.sectionId },
    orderBy: { order: "desc" },
  });

  await prisma.projectTask.create({
    data: {
      projectId: parsed.data.projectId,
      sectionId: parsed.data.sectionId,
      title: parsed.data.title,
      assigneeId: parsed.data.assigneeId || null,
      createdById: user.id,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidateProject(parsed.data.projectId);
  return ok;
}

export async function setTaskStatus(taskId: string, projectId: string, status: string) {
  const user = await requireUser();
  await assertMember(projectId, user.id);
  const valid = ["TODO", "DOING", "DONE"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  await prisma.projectTask.update({ where: { id: taskId }, data: { status: status as never } });
  revalidateProject(projectId);
}

export async function setTaskAssignee(taskId: string, projectId: string, assigneeId: string) {
  const user = await requireUser();
  await assertMember(projectId, user.id);
  await prisma.projectTask.update({ where: { id: taskId }, data: { assigneeId: assigneeId || null } });
  revalidateProject(projectId);
}

export async function deleteTask(taskId: string, projectId: string) {
  const user = await requireUser();
  await assertMember(projectId, user.id);
  await prisma.projectTask.delete({ where: { id: taskId } });
  revalidateProject(projectId);
}

// ---------- Updates ----------

const updateSchema = z.object({
  projectId: z.string().min(1),
  sectionId: z.string().min(1),
  body: z.string().trim().min(1, "Write something first").max(4000),
});

export async function createUpdateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({
    projectId: formData.get("projectId"),
    sectionId: formData.get("sectionId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await assertMember(parsed.data.projectId, user.id);

  await prisma.projectUpdate.create({
    data: {
      projectId: parsed.data.projectId,
      sectionId: parsed.data.sectionId,
      authorId: user.id,
      body: parsed.data.body,
    },
  });
  revalidateProject(parsed.data.projectId);
  return ok;
}

export async function deleteUpdate(updateId: string, projectId: string) {
  const user = await requireUser();
  const update = await prisma.projectUpdate.findUnique({ where: { id: updateId }, select: { authorId: true } });
  if (!update) return;
  const isOwner = await prisma.project.findUnique({ where: { id: projectId }, select: { createdById: true } });
  if (update.authorId !== user.id && isOwner?.createdById !== user.id) throw new Error("Not authorized");
  await prisma.projectUpdate.delete({ where: { id: updateId } });
  revalidateProject(projectId);
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { syncTaskDone } from "@/lib/data/task-links";
import { fail, ok, type ActionState } from "@/lib/actions/types";

function parseTags(raw: FormDataEntryValue | null): string[] {
  const str = String(raw ?? "");
  return Array.from(
    new Set(
      str
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

async function assertOwner(todoId: string, userId: string) {
  const todo = await prisma.todo.findUnique({ where: { id: todoId }, select: { ownerId: true, sourceTaskId: true } });
  if (!todo || todo.ownerId !== userId) throw new Error("Not authorized");
  return todo;
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MED", "HIGH", ""]).optional(),
  projectId: z.string().optional(),
});

export async function createTodoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    priority: (formData.get("priority") as string) || undefined,
    projectId: formData.get("projectId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const peopleIds = formData.getAll("people").map(String).filter(Boolean);
  const tags = parseTags(formData.get("tags"));

  if (parsed.data.projectId) {
    const member = await prisma.project.findFirst({
      where: {
        id: parsed.data.projectId,
        OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }],
      },
      select: { id: true },
    });
    if (!member) return fail("You don't have access to that project");
  }

  const last = await prisma.todo.findFirst({ where: { ownerId: user.id }, orderBy: { order: "desc" }, select: { order: true } });

  await prisma.todo.create({
    data: {
      ownerId: user.id,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      priority: parsed.data.priority || null,
      projectId: parsed.data.projectId || null,
      tags,
      order: (last?.order ?? -1) + 1,
      people: { create: peopleIds.map((userId) => ({ userId })) },
    },
  });

  revalidatePath("/todos");
  revalidatePath("/dashboard");
  return ok;
}

const fieldSchema = z.object({
  id: z.string().min(1),
  field: z.enum(["title", "notes", "dueDate", "priority", "projectId"]),
  value: z.string(),
});

export async function updateTodoField(input: { id: string; field: string; value: string }) {
  const user = await requireUser();
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");
  const { id, field, value } = parsed.data;
  await assertOwner(id, user.id);

  if (field === "projectId" && value) {
    const member = await prisma.project.findFirst({
      where: { id: value, OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] },
      select: { id: true },
    });
    if (!member) throw new Error("You don't have access to that project");
  }

  const data: Record<string, string | Date | null> = {};
  if (field === "title") {
    const t = value.trim();
    if (!t) throw new Error("Title cannot be empty");
    data.title = t;
  } else if (field === "notes") {
    data.notes = value.trim() || null;
  } else if (field === "dueDate") {
    data.dueDate = value ? new Date(value) : null;
  } else if (field === "priority") {
    data.priority = (value || null) as "LOW" | "MED" | "HIGH" | null;
  } else if (field === "projectId") {
    data.projectId = value || null;
  }

  await prisma.todo.update({ where: { id }, data });
  revalidatePath("/todos");
}

export async function toggleTodoDone(id: string, done: boolean) {
  const user = await requireUser();
  const todo = await assertOwner(id, user.id);
  await prisma.todo.update({ where: { id }, data: { done } });
  if (todo.sourceTaskId) await syncTaskDone(todo.sourceTaskId, done, "todo");
  revalidatePath("/todos");
  revalidatePath("/dashboard");
}

export async function deleteTodo(id: string) {
  const user = await requireUser();
  await assertOwner(id, user.id);
  await prisma.todo.delete({ where: { id } });
  revalidatePath("/todos");
  revalidatePath("/dashboard");
}

export async function setTodoPeople(id: string, userIds: string[]) {
  const user = await requireUser();
  await assertOwner(id, user.id);
  const ids = Array.from(new Set(userIds)).slice(0, 30);
  await prisma.$transaction([
    prisma.todoPerson.deleteMany({ where: { todoId: id } }),
    prisma.todoPerson.createMany({ data: ids.map((userId) => ({ todoId: id, userId })) }),
  ]);
  revalidatePath("/todos");
}

export async function setTodoTags(id: string, tags: string[]) {
  const user = await requireUser();
  await assertOwner(id, user.id);
  const clean = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).slice(0, 20);
  await prisma.todo.update({ where: { id }, data: { tags: clean } });
  revalidatePath("/todos");
}

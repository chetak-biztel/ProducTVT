import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentWeekStart, weekKey } from "@/lib/week";

export async function findOrCreateDoneStatus(ownerId: string) {
  const existing = await prisma.planStatus.findFirst({ where: { ownerId, name: "Done" } });
  if (existing) return existing;
  const last = await prisma.planStatus.findFirst({ where: { ownerId }, orderBy: { order: "desc" } });
  return prisma.planStatus.create({ data: { ownerId, name: "Done", order: (last?.order ?? -1) + 1 } });
}

export async function findDefaultStatus(ownerId: string) {
  return (
    (await prisma.planStatus.findFirst({ where: { ownerId, isDefault: true } })) ??
    (await prisma.planStatus.findFirst({ where: { ownerId }, orderBy: { order: "asc" } }))
  );
}

function revalidateForAssignee(assigneeId: string, weekStartDate: Date) {
  revalidatePath("/todos");
  revalidatePath("/dashboard");
  revalidatePath(`/plan?week=${weekKey(weekStartDate)}`);
  revalidatePath(`/team/${assigneeId}?week=${weekKey(weekStartDate)}`);
  revalidatePath("/team");
}

/** Keeps a task's mirrored Todo and this-week Plan item pointed at its current assignee —
    call after creating a task or changing who it's assigned to. Clears both when unassigned,
    and moves them (by delete + recreate) when reassigned to someone else. */
export async function syncTaskAssignee(taskId: string) {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { linkedTodo: true, linkedPlanItem: true },
  });
  if (!task) return;

  if (!task.assigneeId) {
    if (task.linkedTodo) await prisma.todo.delete({ where: { id: task.linkedTodo.id } });
    if (task.linkedPlanItem) await prisma.planItem.delete({ where: { id: task.linkedPlanItem.id } });
    return;
  }

  const assigneeId = task.assigneeId;
  const done = task.status === "DONE";
  let linkedTodo = task.linkedTodo;
  let linkedPlanItem = task.linkedPlanItem;

  // Reassigned to someone else — the old mirrors belong to the previous assignee.
  if (linkedTodo && linkedTodo.ownerId !== assigneeId) {
    await prisma.todo.delete({ where: { id: linkedTodo.id } });
    linkedTodo = null;
  }
  if (linkedPlanItem && linkedPlanItem.ownerId !== assigneeId) {
    await prisma.planItem.delete({ where: { id: linkedPlanItem.id } });
    linkedPlanItem = null;
  }

  if (linkedTodo) {
    await prisma.todo.update({ where: { id: linkedTodo.id }, data: { title: task.title, done } });
  } else {
    const last = await prisma.todo.findFirst({ where: { ownerId: assigneeId }, orderBy: { order: "desc" } });
    await prisma.todo.create({
      data: {
        ownerId: assigneeId,
        title: task.title,
        projectId: task.projectId,
        done,
        order: (last?.order ?? -1) + 1,
        sourceTaskId: task.id,
      },
    });
  }

  const weekStartDate = currentWeekStart();
  const status = done ? await findOrCreateDoneStatus(assigneeId) : await findDefaultStatus(assigneeId);

  if (linkedPlanItem) {
    await prisma.planItem.update({
      where: { id: linkedPlanItem.id },
      data: { title: task.title, statusId: status?.id ?? linkedPlanItem.statusId },
    });
  } else {
    const last = await prisma.planItem.findFirst({
      where: { ownerId: assigneeId, weekStartDate },
      orderBy: { order: "desc" },
    });
    await prisma.planItem.create({
      data: {
        ownerId: assigneeId,
        weekStartDate,
        title: task.title,
        statusId: status?.id,
        order: (last?.order ?? -1) + 1,
        sourceTaskId: task.id,
      },
    });
  }

  revalidateForAssignee(assigneeId, weekStartDate);
}

type DoneSource = "task" | "todo" | "planItem";

/** Propagates a done / not-done change to every record mirrored from the same task — the task
    itself, its linked Todo, and its linked Plan item — skipping whichever one triggered the
    change so it isn't redundantly rewritten. */
export async function syncTaskDone(taskId: string, done: boolean, source: DoneSource) {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { linkedTodo: true, linkedPlanItem: true },
  });
  if (!task || !task.assigneeId) return;
  const assigneeId = task.assigneeId;

  if (source !== "task" && (task.status === "DONE") !== done) {
    await prisma.projectTask.update({ where: { id: taskId }, data: { status: done ? "DONE" : "TODO" } });
  }
  if (source !== "todo" && task.linkedTodo && task.linkedTodo.done !== done) {
    await prisma.todo.update({ where: { id: task.linkedTodo.id }, data: { done } });
  }
  if (source !== "planItem" && task.linkedPlanItem) {
    const status = done ? await findOrCreateDoneStatus(assigneeId) : await findDefaultStatus(assigneeId);
    if (status && task.linkedPlanItem.statusId !== status.id) {
      await prisma.planItem.update({ where: { id: task.linkedPlanItem.id }, data: { statusId: status.id } });
    }
  }

  revalidatePath("/todos");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${task.projectId}`);
  if (task.linkedPlanItem) {
    revalidatePath(`/plan?week=${weekKey(task.linkedPlanItem.weekStartDate)}`);
    revalidatePath(`/team/${assigneeId}?week=${weekKey(task.linkedPlanItem.weekStartDate)}`);
  }
}

/** Todo → its linked weekly-plan row: marking the todo done moves the row to "Done",
    un-doing it moves the row back to the default status. */
export async function syncTodoDoneToPlan(todoId: string, done: boolean) {
  const planItem = await prisma.planItem.findUnique({ where: { sourceTodoId: todoId } });
  if (!planItem) return;
  const status = done ? await findOrCreateDoneStatus(planItem.ownerId) : await findDefaultStatus(planItem.ownerId);
  if (status && planItem.statusId !== status.id) {
    await prisma.planItem.update({ where: { id: planItem.id }, data: { statusId: status.id } });
  }
  revalidatePath(`/plan?week=${weekKey(planItem.weekStartDate)}`);
  revalidatePath(`/team/${planItem.ownerId}?week=${weekKey(planItem.weekStartDate)}`);
  revalidatePath("/dashboard");
}

/** Weekly-plan row → the todo it was created from: a "Done" status ticks the todo, anything else un-ticks it. */
export async function syncPlanDoneToTodo(todoId: string, done: boolean) {
  await prisma.todo.updateMany({ where: { id: todoId, done: !done }, data: { done } });
  revalidatePath("/todos");
  revalidatePath("/dashboard");
}

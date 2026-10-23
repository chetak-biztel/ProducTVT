import { requireUser } from "@/lib/rbac";
import { getTodos, getMyProjects } from "@/lib/data/todos";
import { getActiveUsers } from "@/lib/data/lookups";
import { PageHeader } from "@/components/page-header";
import { CreateTodoDialog } from "@/components/todos/create-todo-dialog";
import { TodoList } from "@/components/todos/todo-list";
import type { TodoDTO } from "@/components/todos/types";

export default async function TodosPage() {
  const user = await requireUser();
  const [todosRaw, projects, users] = await Promise.all([
    getTodos(user.id),
    getMyProjects(user.id),
    getActiveUsers(),
  ]);

  const todos: TodoDTO[] = todosRaw.map((t) => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
    done: t.done,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    priority: t.priority,
    tags: t.tags,
    project: t.project,
    people: t.people.map((p) => p.user),
    planWeek: (t.linkedPlanItem ?? t.sourceTask?.linkedPlanItem)?.weekStartDate.toISOString().slice(0, 10) ?? null,
    planFromTask: !t.linkedPlanItem && !!t.sourceTask?.linkedPlanItem,
  }));

  const allUsers = users.filter((u) => u.id !== user.id).map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <PageHeader title="Todos" subtitle="Your personal task list — tag a project, people, or labels to stay organized.">
        {/* Phones already have the floating + button for this. */}
        <div className="hidden md:block">
          <CreateTodoDialog projects={projects} allUsers={allUsers} />
        </div>
      </PageHeader>

      <TodoList todos={todos} projects={projects} allUsers={allUsers} />
    </div>
  );
}

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
  }));

  const allUsers = users.filter((u) => u.id !== user.id).map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <PageHeader title="Todos" subtitle="Your personal task list — tag a project, people, or labels to stay organized.">
        <CreateTodoDialog projects={projects} allUsers={allUsers} />
      </PageHeader>

      <TodoList todos={todos} projects={projects} allUsers={allUsers} />
    </div>
  );
}

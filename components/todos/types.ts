export type TodoPersonDTO = { id: string; name: string };
export type TodoProjectDTO = { id: string; name: string };

export type TodoDTO = {
  id: string;
  title: string;
  notes: string | null;
  done: boolean;
  dueDate: string | null; // ISO date
  priority: "LOW" | "MED" | "HIGH" | null;
  tags: string[];
  project: TodoProjectDTO | null;
  people: TodoPersonDTO[];
  /** Week (yyyy-mm-dd Monday) of the plan row this todo is on, if any. */
  planWeek: string | null;
  /** On the plan because it came from an assigned project task — managed by that task, not the checkbox. */
  planFromTask: boolean;
};

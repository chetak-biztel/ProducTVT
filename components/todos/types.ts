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
};

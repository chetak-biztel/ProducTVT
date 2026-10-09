import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Notepad } from "@/components/notes/notepad";
import type { NoteDTO } from "@/components/notes/types";

export default async function NotesPage() {
  const user = await requireUser();
  const notes = await prisma.note.findMany({
    where: { ownerId: user.id },
    orderBy: { order: "asc" },
    select: { id: true, title: true, content: true, updatedAt: true },
  });

  const initial: NoteDTO[] = notes.map((n) => ({ ...n, updatedAt: n.updatedAt.toISOString() }));

  return (
    <div>
      <PageHeader title="Notepad" subtitle="Quick plain-text notes — saved automatically as you type." />
      <Notepad initialNotes={initial} />
    </div>
  );
}

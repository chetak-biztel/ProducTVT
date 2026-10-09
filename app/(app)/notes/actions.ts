"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import type { NoteDTO } from "@/components/notes/types";

const MAX_CONTENT = 200_000;

async function assertOwner(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { ownerId: true } });
  if (!note || note.ownerId !== userId) throw new Error("Not authorized");
}

function toDTO(n: { id: string; title: string; content: string; updatedAt: Date }): NoteDTO {
  return { id: n.id, title: n.title, content: n.content, updatedAt: n.updatedAt.toISOString() };
}

export async function createNote(): Promise<NoteDTO> {
  const user = await requireUser();
  const [last, count] = await Promise.all([
    prisma.note.findFirst({ where: { ownerId: user.id }, orderBy: { order: "desc" }, select: { order: true } }),
    prisma.note.count({ where: { ownerId: user.id } }),
  ]);
  const note = await prisma.note.create({
    data: { ownerId: user.id, title: count === 0 ? "Untitled" : `Untitled ${count + 1}`, order: (last?.order ?? -1) + 1 },
  });
  return toDTO(note);
}

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().max(MAX_CONTENT, "Note is too long").optional(),
});

/** Autosave target — no revalidatePath, the client already holds the latest text. */
export async function updateNote(input: { id: string; title?: string; content?: string }): Promise<string> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id, ...data } = parsed.data;
  await assertOwner(id, user.id);
  const note = await prisma.note.update({ where: { id }, data, select: { updatedAt: true } });
  return note.updatedAt.toISOString();
}

export async function deleteNote(id: string) {
  const user = await requireUser();
  await assertOwner(id, user.id);
  await prisma.note.delete({ where: { id } });
}

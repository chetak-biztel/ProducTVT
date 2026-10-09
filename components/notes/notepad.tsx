"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Plus,
  X,
  Download,
  TextWrap,
  ZoomIn,
  ZoomOut,
  Check,
  LoaderCircle,
  CircleAlert,
  NotebookPen,
} from "lucide-react";
import { createNote, updateNote, deleteNote } from "@/app/(app)/notes/actions";
import { EmptyState } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { NoteDTO } from "./types";

type SaveState = "dirty" | "saving" | "saved" | "error";
type Patch = { title?: string; content?: string };

const SAVE_DELAY = 700;
const FONT_MIN = 11;
const FONT_MAX = 28;
const FONT_DEFAULT = 15;

// Per-viewer preferences (word wrap, zoom, last open tab) live in localStorage.
const storageListeners = new Set<() => void>();
function subscribeStorage(cb: () => void) {
  storageListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    storageListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function useStored(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => {
      try {
        return localStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const set = useCallback(
    (v: string) => {
      try {
        localStorage.setItem(key, v);
      } catch {}
      storageListeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}

function cursorPosition(text: string, index: number) {
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const col = index - before.lastIndexOf("\n");
  return { line, col };
}

function countWords(text: string) {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function Notepad({ initialNotes }: { initialNotes: NoteDTO[] }) {
  const [notes, setNotes] = useState<NoteDTO[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [wrapPref, setWrapPref] = useStored("notepad:wrap", "1");
  const [fontPref, setFontPref] = useStored("notepad:fontSize", String(FONT_DEFAULT));
  const [lastActiveId, setLastActiveId] = useStored("notepad:active", "");
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const pending = useRef(new Map<string, Patch>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef(new Map<string, HTMLElement>());

  const wrap = wrapPref !== "0";
  const fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, Number(fontPref) || FONT_DEFAULT));
  const setFontSize = (fn: (s: number) => number) => setFontPref(String(fn(fontSize)));

  // Explicit selection first, then the tab open last visit, then the first tab.
  const active =
    notes.find((n) => n.id === selectedId) ?? notes.find((n) => n.id === lastActiveId) ?? notes[0] ?? null;
  const activeId = active?.id ?? null;

  function setActiveId(id: string | null) {
    setSelectedId(id);
    if (id) setLastActiveId(id);
    setCursor({ line: 1, col: 1 });
  }

  useEffect(() => {
    if (activeId) tabRefs.current.get(activeId)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  const flush = useCallback(async (id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    const patch = pending.current.get(id);
    if (!patch) return;
    pending.current.delete(id);
    setSaveState((s) => ({ ...s, [id]: "saving" }));
    try {
      const updatedAt = await updateNote({ id, ...patch });
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, updatedAt } : n)));
      setSaveState((s) => ({ ...s, [id]: pending.current.has(id) ? "dirty" : "saved" }));
    } catch {
      // Put the failed patch back (newer edits win) so the next keystroke or Ctrl+S retries it.
      pending.current.set(id, { ...patch, ...pending.current.get(id) });
      setSaveState((s) => ({ ...s, [id]: "error" }));
    }
  }, []);

  const scheduleSave = useCallback(
    (id: string, patch: Patch, delay = SAVE_DELAY) => {
      pending.current.set(id, { ...pending.current.get(id), ...patch });
      setSaveState((s) => ({ ...s, [id]: "dirty" }));
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.set(id, setTimeout(() => flush(id), delay));
    },
    [flush],
  );

  // Warn before leaving with unsaved edits; flush everything when the page unmounts.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    const timersMap = timers.current;
    const pendingMap = pending.current;
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      for (const t of timersMap.values()) clearTimeout(t);
      for (const [id, patch] of pendingMap) updateNote({ id, ...patch }).catch(() => {});
      pendingMap.clear();
    };
  }, []);

  function setContent(id: string, content: string) {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, content } : n)));
    scheduleSave(id, { content });
  }

  async function handleNew() {
    if (creating) return;
    setCreating(true);
    try {
      const note = await createNote();
      setNotes((ns) => [...ns, note]);
      setActiveId(note.id);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } finally {
      setCreating(false);
    }
  }

  async function handleClose(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (note.content.trim() && !window.confirm(`Delete "${note.title}"? This can't be undone.`)) return;

    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    pending.current.delete(id);

    const idx = notes.findIndex((n) => n.id === id);
    const rest = notes.filter((n) => n.id !== id);
    setNotes(rest);
    if (activeId === id) setActiveId(rest[Math.min(idx, rest.length - 1)]?.id ?? null);
    try {
      await deleteNote(id);
    } catch {
      // Restore the tab if the delete didn't go through.
      setNotes((ns) => {
        const copy = [...ns];
        copy.splice(idx, 0, note);
        return copy;
      });
    }
  }

  function commitRename(id: string, value: string) {
    setEditingId(null);
    const title = value.trim().slice(0, 120);
    const note = notes.find((n) => n.id === id);
    if (!title || !note || title === note.title) return;
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, title } : n)));
    scheduleSave(id, { title }, 0);
  }

  function handleDownload() {
    if (!active) return;
    const blob = new Blob([active.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/[\\/:*?"<>|]+/g, "_") || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateCursor() {
    const el = textareaRef.current;
    if (el) setCursor(cursorPosition(el.value, el.selectionStart));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!active) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      flush(active.id);
      return;
    }
    // Tab inserts a tab character, like a real text editor.
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value } = el;
      setContent(active.id, value.slice(0, start) + "\t" + value.slice(end));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1;
        updateCursor();
      });
    }
  }

  const state = active ? saveState[active.id] : undefined;

  if (!active) {
    return (
      <EmptyState
        icon={<NotebookPen size={36} />}
        title="No notes yet"
        hint="Open a blank page and start typing — everything saves automatically."
      >
        <button className="btn btn-accent" onClick={handleNew} disabled={creating}>
          <Plus size={16} /> New note
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="card flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex items-end gap-1 border-b bg-[color-mix(in_srgb,var(--accent)_4%,var(--tint))] px-2 pt-2">
        <div className="scroll-thin flex min-w-0 items-end gap-1 overflow-x-auto" role="tablist">
          {notes.map((n) => {
            const isActive = n.id === activeId;
            const st = saveState[n.id];
            return (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(n.id, el);
                  else tabRefs.current.delete(n.id);
                }}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                title={`${n.title} — double-click to rename`}
                onClick={() => setActiveId(n.id)}
                onDoubleClick={() => setEditingId(n.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) handleClose(n.id);
                }}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") setActiveId(n.id);
                  if (e.key === "F2") setEditingId(n.id);
                }}
                className={cn(
                  "group relative flex h-9 w-44 shrink-0 cursor-pointer select-none items-center gap-2 rounded-t-lg border border-b-0 px-3 text-sm transition-colors",
                  isActive
                    ? "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                    : "border-transparent text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--tint))] hover:text-[var(--text)]",
                )}
              >
                {isActive && <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-[var(--accent)]" />}
                {editingId === n.id ? (
                  <input
                    autoFocus
                    defaultValue={n.title}
                    maxLength={120}
                    className="min-w-0 flex-1 rounded bg-transparent text-sm outline-none ring-1 ring-[var(--accent)]"
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => commitRename(n.id, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate">{n.title}</span>
                )}
                {(st === "dirty" || st === "saving") && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] group-hover:hidden" />
                )}
                <button
                  type="button"
                  aria-label={`Delete ${n.title}`}
                  title="Delete note"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose(n.id);
                  }}
                  className={cn(
                    "shrink-0 rounded p-0.5 text-[var(--text-faint)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,var(--tint))] hover:text-[var(--text)]",
                    isActive ? "visible" : "invisible group-hover:visible",
                  )}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          className="btn btn-ghost btn-icon mb-1 shrink-0"
          onClick={handleNew}
          disabled={creating}
          title="New note"
          aria-label="New note"
        >
          {creating ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b px-2 py-1">
        <button className="btn btn-ghost btn-sm" onClick={handleNew} disabled={creating}>
          <Plus size={14} /> New
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleDownload} title="Download as .txt">
          <Download size={14} /> Save as .txt
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <button
          className={cn("btn btn-ghost btn-sm", wrap && "text-[var(--accent)]")}
          onClick={() => setWrapPref(wrap ? "0" : "1")}
          aria-pressed={wrap}
          title="Word wrap"
        >
          <TextWrap size={14} /> Word wrap
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setFontSize((s) => Math.max(FONT_MIN, s - 1))}
          disabled={fontSize <= FONT_MIN}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setFontSize((s) => Math.min(FONT_MAX, s + 1))}
          disabled={fontSize >= FONT_MAX}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={15} />
        </button>
      </div>

      {/* Editor */}
      <textarea
        key={active.id}
        ref={textareaRef}
        value={active.content}
        onChange={(e) => {
          setContent(active.id, e.target.value);
          updateCursor();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={updateCursor}
        onClick={updateCursor}
        onSelect={updateCursor}
        wrap={wrap ? "soft" : "off"}
        spellCheck={false}
        placeholder="Start typing…"
        aria-label={active.title}
        className="scroll-thin min-h-0 flex-1 resize-none bg-[var(--surface)] p-4 font-mono leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
        style={{ fontSize, tabSize: 4, whiteSpace: wrap ? "pre-wrap" : "pre" }}
      />

      {/* Status bar */}
      <div className="flex items-center gap-4 border-t bg-[color-mix(in_srgb,var(--accent)_4%,var(--tint))] px-3 py-1.5 text-xs text-[var(--text-muted)]">
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className="hidden sm:inline">{active.content.length.toLocaleString()} characters</span>
        <span className="hidden sm:inline">{countWords(active.content).toLocaleString()} words</span>
        <span className="ml-auto flex items-center gap-1.5">
          {state === "saving" || state === "dirty" ? (
            <>
              <LoaderCircle size={12} className="animate-spin" /> Saving…
            </>
          ) : state === "error" ? (
            <span className="flex items-center gap-1.5 text-[#e11d48]">
              <CircleAlert size={12} /> Not saved — press Ctrl+S to retry
            </span>
          ) : (
            <>
              <Check size={12} /> Saved
            </>
          )}
        </span>
        <span className="hidden sm:inline">{Math.round((fontSize / FONT_DEFAULT) * 100)}%</span>
        <span className="hidden sm:inline">UTF-8</span>
      </div>
    </div>
  );
}

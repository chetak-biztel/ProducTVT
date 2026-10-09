"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarRange,
  CheckSquare,
  FolderKanban,
  Loader2,
  NotebookPen,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { searchEverything, type SearchResult } from "@/lib/actions/search";
import { CreateTodoDialog } from "@/components/todos/create-todo-dialog";
import { buildLinks } from "@/components/nav-links";
import { cn } from "@/lib/utils";

/* Client-side frame around every signed-in page: keyboard shortcuts, the Ctrl+K search
   palette, the global "new todo" dialog (and its phone + button), and refresh-on-return. */

type ShellContextValue = { openSearch: () => void; openQuickAdd: () => void };
const ShellContext = createContext<ShellContextValue>({ openSearch: () => {}, openQuickAdd: () => {} });
export const useAppShell = () => useContext(ShellContext);

const REFRESH_AFTER_MS = 30_000;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function AppShell({
  role,
  projects,
  allUsers,
  children,
}: {
  role: string;
  projects: { id: string; name: string }[];
  allUsers: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openQuickAdd = useCallback(() => setQuickAddOpen(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector("[aria-modal='true'], [role='alertdialog']")) return;
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Coming back to the tab (or unlocking the phone) pulls in teammates' changes.
  const lastRefresh = useRef(0);
  useEffect(() => {
    lastRefresh.current = Date.now();
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh.current < REFRESH_AFTER_MS) return;
      lastRefresh.current = Date.now();
      router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  return (
    <ShellContext.Provider value={{ openSearch, openQuickAdd }}>
      {children}

      {/* Phone quick-add, sitting above the bottom tab bar (not on the notepad, where it would cover the editor). */}
      {!pathname.startsWith("/notes") && (
        <button
          type="button"
          onClick={openQuickAdd}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] md:hidden"
          style={{ boxShadow: "0 10px 24px -8px color-mix(in srgb, var(--accent) 70%, transparent)" }}
          aria-label="New todo"
        >
          <Plus size={24} />
        </button>
      )}

      <CreateTodoDialog
        projects={projects}
        allUsers={allUsers}
        trigger={null}
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />

      {searchOpen && (
        <CommandPalette
          role={role}
          onClose={() => setSearchOpen(false)}
          onNewTodo={() => {
            setSearchOpen(false);
            setQuickAddOpen(true);
          }}
        />
      )}
    </ShellContext.Provider>
  );
}

const KIND_ICON: Record<SearchResult["kind"], LucideIcon> = {
  todo: CheckSquare,
  plan: CalendarRange,
  project: FolderKanban,
  note: NotebookPen,
};
const KIND_LABEL: Record<SearchResult["kind"], string> = {
  todo: "Todos",
  plan: "Weekly plan",
  project: "Projects",
  note: "Notes",
};

type PaletteItem = { key: string; label: string; hint?: string; icon: LucideIcon; group: string; run: () => void };

function CommandPalette({ role, onClose, onNewTodo }: { role: string; onClose: () => void; onNewTodo: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onQueryChange(value: string) {
    setQ(value);
    setActiveIndex(0);
    const id = ++reqId.current;
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    // Small debounce so typing a word fires one search, not one per letter.
    setTimeout(() => {
      if (id !== reqId.current) return;
      startSearch(async () => {
        const r = await searchEverything(value);
        if (id === reqId.current) setResults(r);
      });
    }, 180);
  }

  const needle = q.trim().toLowerCase();
  const pages: PaletteItem[] = buildLinks(role)
    .filter((l) => !needle || l.label.toLowerCase().includes(needle))
    .map((l) => ({ key: `page:${l.href}`, label: l.label, icon: ArrowRight, group: "Go to", run: () => go(l.href) }));
  const actions: PaletteItem[] =
    !needle || "new todo".includes(needle) || "add todo".includes(needle)
      ? [{ key: "action:new-todo", label: "New todo", hint: "N", icon: Plus, group: "Actions", run: onNewTodo }]
      : [];
  const found: PaletteItem[] = results.map((r) => ({
    key: `${r.kind}:${r.id}`,
    label: r.title,
    hint: r.hint,
    icon: KIND_ICON[r.kind],
    group: KIND_LABEL[r.kind],
    run: () => go(r.href),
  }));
  const items = [...actions, ...found, ...pages];
  const active = Math.min(activeIndex, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((active + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((active - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let lastGroup = "";

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-start justify-center p-3 pt-[10vh] sm:p-8 sm:pt-[12vh]">
      <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-[2px] animate-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="card animate-in relative flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4">
          {searching ? (
            <Loader2 size={17} className="shrink-0 animate-spin text-[var(--text-faint)]" />
          ) : (
            <Search size={17} className="shrink-0 text-[var(--text-faint)]" />
          )}
          <input
            autoFocus
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search todos, plans, projects, notes…"
            className="h-12 w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            aria-label="Search"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--border-strong)] px-1.5 text-[10px] text-[var(--text-faint)] sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="scroll-thin overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
              {searching ? "Searching…" : "No matches."}
            </p>
          )}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.key}>
                {header && (
                  <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  data-index={i}
                  onMouseMove={() => setActiveIndex(i)}
                  onClick={item.run}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                    i === active ? "bg-[color-mix(in_srgb,var(--accent)_10%,var(--tint))] text-[var(--text)]" : "text-[var(--text-muted)]",
                  )}
                >
                  <Icon size={15} className="shrink-0 text-[var(--text-faint)]" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-xs text-[var(--text-faint)]">{item.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="hidden items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-faint)] sm:flex">
          <span>↑↓ to move · Enter to open</span>
          <span className="ml-auto">
            <kbd>N</kbd> new todo · <kbd>/</kbd> or <kbd>Ctrl K</kbd> search
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

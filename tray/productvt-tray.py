#!/usr/bin/env python3
"""ProducTVT todos in the top bar: a glass panel to add, tick and plan todos (Super+Shift+T).

Talks straight to the ProducTVT database using the connection string in ProductVT/.env, so it
only works on a machine that has that file. Mirrors what the web app does in
app/(app)/todos/actions.ts and lib/data/task-links.ts: a todo can carry a linked row on this
week's plan, and ticking it moves that row (and any project task it came from) to Done.

Needs the AppIndicator GNOME extension (on by default in Ubuntu), gir1.2-appindicator3-0.1 and
python3-psycopg2. Settings live in ~/.config/productvt-tray/config.json.
"""
import json
import os
import queue
import random
import string
import subprocess
import sys
import threading
import time
import traceback
from datetime import datetime, timedelta, timezone

import psycopg2

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('Gdk', '3.0')
gi.require_version('AppIndicator3', '0.1')
from gi.repository import AppIndicator3, Gdk, GdkPixbuf, Gio, GLib, Gtk  # noqa: E402

APP_ID = 'ai.biztel.productvt.tray'
HERE = os.path.dirname(os.path.realpath(__file__))
ICON = os.path.join(HERE, '..', 'app', 'icon.png')
ICONS = os.path.join(HERE, 'icons')
TRAY_ICON = os.path.join(ICONS, 'productvt-tray.svg')  # the logo's mark without its white tile, which vanishes in the top bar
LOG = os.path.expanduser('~/.cache/productvt-tray.log')
EXTENSION = 'day-tracker@chetakk'  # the merged top-bar button (day-tracker/gnome-extension) also shows the todo count
CONFIG = os.path.expanduser('~/.config/productvt-tray/config.json')
DEFAULTS = {
    'username': '',  # your ProducTVT login
    'env': os.path.join(os.path.dirname(HERE), '.env'),  # where the database connection string is
    'appUrl': '',  # optional: shows an "Open ProducTVT" button
}
PANEL_W = 360
DONE_SHOWN = 15
PLAN = '#06b6d4'

CSS = b"""
window.pv-panel, window.pv-panel decoration {
  background-color: transparent; background-image: none; border: none; box-shadow: none; margin: 0;
}
.panel {
  background-image: linear-gradient(160deg, rgba(38, 40, 50, 0.93), rgba(12, 14, 20, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 16px;
  color: #f4f4f5;
  font-family: "Ubuntu", sans-serif;
}
.title { font-weight: 800; font-size: 15px; }
.muted { color: #a1a1aa; font-size: 12px; }
.faint { color: #71717a; font-size: 11px; }
.date { font-family: "JetBrainsMono Nerd Font", monospace; font-size: 10px; font-weight: 700; color: #71717a; }
.count { font-family: "JetBrainsMono Nerd Font", monospace; font-weight: 700; font-size: 13px; }
.add {
  background-color: #23252d;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 3px 4px 3px 12px;
}
.add.focus { border-color: rgba(255, 255, 255, 0.35); }
/* Solid, not see-through: on a see-through window GTK can clear a translucent entry to nothing. */
entry.add-entry, entry.add-entry:focus, entry.add-entry:hover {
  background-image: none; background-color: #23252d; border: none; box-shadow: none; outline: none;
  color: #f4f4f5; caret-color: #f4f4f5; padding: 6px 0; font-size: 13px; min-height: 0;
}
entry.add-entry selection { background-color: rgba(6, 182, 212, 0.45); }
.row { border-radius: 10px; padding: 5px 8px; }
.row:hover { background-color: rgba(255, 255, 255, 0.05); }
.todo { font-size: 13px; }
.todo.done { color: #71717a; }
button.check {
  background-image: none; background-color: transparent; box-shadow: none; text-shadow: none;
  border: 2px solid rgba(255, 255, 255, 0.28); border-radius: 999px;
  min-width: 14px; min-height: 14px; padding: 0; color: #09090b; font-size: 9px; font-weight: 900;
}
button.check:hover { border-color: #f4f4f5; }
button.check.on { background-color: #d4d4d8; border-color: #d4d4d8; }
button.plan, button.del {
  background-image: none; background-color: transparent; border: none; box-shadow: none; text-shadow: none;
  border-radius: 8px; min-width: 24px; min-height: 24px; padding: 0; color: #71717a;
}
button.plan:hover { background-color: rgba(255, 255, 255, 0.10); color: #f4f4f5; }
button.plan.on { background-color: """ + PLAN.encode() + b"""; color: #04121a; }
button.plan.on:hover { background-color: #22d3ee; }
button.plan:disabled { opacity: 0.45; }
button.plan.on:disabled { background-color: rgba(6, 182, 212, 0.45); }
button.plan.past { box-shadow: inset 0 0 0 1px rgba(6, 182, 212, 0.6); color: #67e8f9; }
button.del { opacity: 0.55; font-size: 11px; }
button.del:hover { opacity: 1; color: #f43f5e; background-color: rgba(244, 63, 94, 0.12); }
button.fold {
  background-image: none; background-color: transparent; border: none; box-shadow: none; text-shadow: none;
  padding: 2px 8px; color: #a1a1aa; font-size: 12px; font-weight: 700;
}
button.fold:hover { color: #f4f4f5; }
button.link {
  background-image: none; background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px; padding: 4px 14px; color: #d4d4d8; box-shadow: none; text-shadow: none; font-size: 12px;
}
button.link:hover { border-color: rgba(255, 255, 255, 0.35); color: #ffffff; }
.error { color: #fb7185; font-size: 12px; }
scrollbar slider { background-color: rgba(255, 255, 255, 0.18); min-width: 4px; border-radius: 999px; }
"""


def load_config():
    cfg = dict(DEFAULTS)
    try:
        with open(CONFIG) as f:
            cfg.update(json.load(f))
    except (OSError, ValueError):
        pass
    return cfg


def guess_username():
    """Your username is usually the start of your git email (chetak@… → chetak)."""
    try:
        email = subprocess.run(['git', '-C', HERE, 'config', 'user.email'], capture_output=True, text=True, timeout=3).stdout
    except (OSError, subprocess.SubprocessError):
        return ''
    return email.strip().split('@')[0]


def extension_active():
    """Whether the top-bar extension is running; then it draws the icon instead of AppIndicator."""
    try:
        info = Gio.bus_get_sync(Gio.BusType.SESSION).call_sync(
            'org.gnome.Shell.Extensions', '/org/gnome/Shell/Extensions', 'org.gnome.Shell.Extensions',
            'GetExtensionInfo', GLib.Variant('(s)', (EXTENSION,)), None, Gio.DBusCallFlags.NONE, 2000, None)
        return info.unpack()[0].get('state') == 1.0  # ENABLED
    except GLib.Error:
        return False


def save_config(cfg):
    os.makedirs(os.path.dirname(CONFIG), exist_ok=True)
    with open(CONFIG, 'w') as f:
        json.dump(cfg, f, indent=2)


def db_url(env_path):
    """The session-pooler URL from ProductVT/.env, without Prisma-only query options."""
    env = {}
    with open(env_path) as f:
        for line in f:
            key, sep, value = line.strip().partition('=')
            if sep and not key.startswith('#'):
                env[key.strip()] = value.strip().strip('"\'')
    url = env.get('DIRECT_URL') or env.get('DATABASE_URL')
    if not url:
        raise RuntimeError('No DIRECT_URL or DATABASE_URL in ' + env_path)
    return url.split('?')[0]


def new_id():
    """A cuid-shaped id, like the ones Prisma makes."""
    t = int(time.time() * 1000)
    stamp = ''
    while t:
        t, r = divmod(t, 36)
        stamp = (string.digits + string.ascii_lowercase)[r] + stamp
    return 'c' + stamp + ''.join(random.choices(string.ascii_lowercase + string.digits, k=24 - len(stamp)))


def week_start():
    """Monday of the current week in UTC, as lib/week.ts keys plan weeks."""
    d = datetime.now(timezone.utc).date()
    return d - timedelta(days=d.weekday())


class Store:
    """The todo queries. Every public method runs in one transaction."""

    def __init__(self, env_path):
        self.url = db_url(env_path)
        self.conn = None

    def _run(self, fn, *args):
        for attempt in range(2):
            try:
                if self.conn is None or self.conn.closed:
                    self.conn = psycopg2.connect(self.url, connect_timeout=10, application_name='productvt-tray')
                with self.conn, self.conn.cursor() as cur:
                    return fn(cur, *args)
            except (psycopg2.OperationalError, psycopg2.InterfaceError):
                self.conn = None  # dropped by the pooler — reconnect once
                if attempt:
                    raise

    def user_id(self, username):
        def q(cur):
            # The login name, or failing that the display name if only one person has it.
            cur.execute('SELECT id, username = lower(%s) FROM "User" WHERE active AND (username = lower(%s) OR lower(name) = lower(%s)) '
                        'ORDER BY 2 DESC LIMIT 2', (username, username, username))
            rows = cur.fetchall()
            return rows[0][0] if rows and (rows[0][1] or len(rows) == 1) else None
        return self._run(q)

    def todos(self, uid):
        def q(cur):
            cur.execute("""
                SELECT t.id, t.title, t.done, own."weekStartDate", task."weekStartDate"
                FROM "Todo" t
                LEFT JOIN "PlanItem" own ON own."sourceTodoId" = t.id
                LEFT JOIN "PlanItem" task ON t."sourceTaskId" IS NOT NULL AND task."sourceTaskId" = t."sourceTaskId"
                WHERE t."ownerId" = %s
                ORDER BY t.done, t."order", t."createdAt" DESC""", (uid,))
            week = week_start()
            return [{'id': i, 'title': title, 'done': done, 'planWeek': own or task,
                     'inPlan': (own or task) == week, 'planFromTask': own is None and task is not None}
                    for i, title, done, own, task in cur.fetchall()]
        return self._run(q)

    def add(self, uid, title, plan):
        def q(cur):
            cur.execute('SELECT COALESCE(MAX("order"), -1) + 1 FROM "Todo" WHERE "ownerId" = %s', (uid,))
            tid = new_id()
            cur.execute('INSERT INTO "Todo" (id, "ownerId", title, "order") VALUES (%s, %s, %s, %s)',
                        (tid, uid, title, cur.fetchone()[0]))
            if plan:
                self._add_to_plan(cur, uid, tid, title, False)
        self._run(q)

    def set_done(self, uid, tid, done):
        def q(cur):
            task = self._owned(cur, uid, tid)
            cur.execute('UPDATE "Todo" SET done = %s WHERE id = %s', (done, tid))
            if task:  # the project task it mirrors, and that task's plan row
                cur.execute('UPDATE "ProjectTask" SET status = %s WHERE id = %s AND (status = \'DONE\') <> %s',
                            ('DONE' if done else 'TODO', task, done))
                self._set_plan_status(cur, uid, '"sourceTaskId"', task, done)
            self._set_plan_status(cur, uid, '"sourceTodoId"', tid, done)
        self._run(q)

    def set_plan(self, uid, tid, on):
        def q(cur):
            self._owned(cur, uid, tid)
            cur.execute('SELECT id, "weekStartDate" FROM "PlanItem" WHERE "sourceTodoId" = %s', (tid,))
            linked = cur.fetchone()
            this_week = linked is not None and linked[1] == week_start()
            if on and not this_week:
                cur.execute('SELECT title, done FROM "Todo" WHERE id = %s', (tid,))
                title, done = cur.fetchone()
                if linked:
                    # Still on an earlier week's plan: that row stays there as history, and the todo
                    # carries over to a new row this week (a todo links to one plan row at a time).
                    cur.execute('UPDATE "PlanItem" SET "sourceTodoId" = NULL, "updatedAt" = now() WHERE id = %s', (linked[0],))
                self._add_to_plan(cur, uid, tid, title, done, carry_from=linked and linked[0])
            elif not on and this_week:
                cur.execute('DELETE FROM "PlanItem" WHERE id = %s', (linked[0],))
        self._run(q)

    def delete(self, uid, tid):
        def q(cur):
            self._owned(cur, uid, tid)
            cur.execute('DELETE FROM "Todo" WHERE id = %s', (tid,))
        self._run(q)

    # -- helpers, inside a transaction --

    @staticmethod
    def _owned(cur, uid, tid):
        """Checks the todo is `uid`'s; returns the project task it mirrors, if any."""
        cur.execute('SELECT "ownerId", "sourceTaskId" FROM "Todo" WHERE id = %s', (tid,))
        row = cur.fetchone()
        if not row or row[0] != uid:
            raise RuntimeError('That todo is gone')
        return row[1]

    def _add_to_plan(self, cur, uid, tid, title, done, carry_from=None):
        """A plan row for this todo on this week's plan; `carry_from` is an earlier week's row to
        copy the category, tag, status and assignee from."""
        week = week_start()
        category = sub_tag = status = assignee = None
        if carry_from:
            cur.execute('SELECT "categoryId", "subTag", "statusId", "assigneeId" FROM "PlanItem" WHERE id = %s', (carry_from,))
            category, sub_tag, status, assignee = cur.fetchone()
        if done:
            status = self._done_status(cur, uid)
        elif not status:
            status = self._default_status(cur, uid)
        cur.execute('SELECT COALESCE(MAX("order"), -1) + 1 FROM "PlanItem" WHERE "ownerId" = %s AND "weekStartDate" = %s',
                    (uid, week))
        cur.execute("""INSERT INTO "PlanItem" (id, "ownerId", "weekStartDate", "categoryId", "subTag", title, "statusId",
                                             "assigneeId", "order", "updatedAt", "sourceTodoId")
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now(), %s)""",
                    (new_id(), uid, week, category, sub_tag, title, status, assignee, cur.fetchone()[0], tid))

    def _set_plan_status(self, cur, uid, column, source, done):
        status = self._done_status(cur, uid) if done else self._default_status(cur, uid)
        if status:
            cur.execute('UPDATE "PlanItem" SET "statusId" = %s, "updatedAt" = now() WHERE ' + column +
                        ' = %s AND "statusId" IS DISTINCT FROM %s', (status, source, status))

    @staticmethod
    def _default_status(cur, uid):
        cur.execute('SELECT id FROM "PlanStatus" WHERE "ownerId" = %s ORDER BY "isDefault" DESC, "order" LIMIT 1', (uid,))
        row = cur.fetchone()
        return row[0] if row else None

    @staticmethod
    def _done_status(cur, uid):
        cur.execute('SELECT id FROM "PlanStatus" WHERE "ownerId" = %s AND name = \'Done\'', (uid,))
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute('SELECT COALESCE(MAX("order"), -1) + 1 FROM "PlanStatus" WHERE "ownerId" = %s', (uid,))
        sid = new_id()
        cur.execute('INSERT INTO "PlanStatus" (id, "ownerId", name, "order") VALUES (%s, %s, \'Done\', %s)',
                    (sid, uid, cur.fetchone()[0]))
        return sid


class Worker(threading.Thread):
    """Runs database calls one at a time off the UI thread; replies land back on it."""

    def __init__(self):
        super().__init__(daemon=True)
        self.jobs = queue.Queue()
        self.start()

    def submit(self, fn, on_done=None, on_error=None):
        self.jobs.put((fn, on_done, on_error))

    def run(self):
        while True:
            fn, on_done, on_error = self.jobs.get()
            try:
                result = fn()
            except Exception as e:  # noqa: BLE001 — shown in the panel
                with open(LOG, 'a') as f:
                    f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + traceback.format_exc() + '\n')
                if on_error:
                    GLib.idle_add(on_error, str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__)
            else:
                if on_done:
                    GLib.idle_add(on_done, result)


def label(text='', *classes, xalign=0):
    lab = Gtk.Label(label=text, xalign=xalign)
    for c in classes:
        lab.get_style_context().add_class(c)
    return lab


def button(child, *classes, tooltip=None, on_click=None):
    b = Gtk.Button()
    b.add(child if isinstance(child, Gtk.Widget) else Gtk.Label(label=child))
    b.set_relief(Gtk.ReliefStyle.NONE)
    b.set_can_focus(False)
    for c in classes:
        b.get_style_context().add_class(c)
    if tooltip:
        b.set_tooltip_text(tooltip)
    if on_click:
        b.connect('clicked', lambda _w: on_click())
    return b


def set_class(widget, name, on):
    ctx = widget.get_style_context()
    (ctx.add_class if on else ctx.remove_class)(name)


def calendar_icon(on):
    """Calendar with a + (add to this week's plan) or a tick (on it)."""
    path = os.path.join(ICONS, 'plan-on.svg' if on else 'plan-add.svg')
    return Gtk.Image.new_from_pixbuf(GdkPixbuf.Pixbuf.new_from_file_at_size(path, 15, 15))


class Panel(Gtk.Window):
    """Frosted popup under the top bar: add box, today's todos, a plan toggle on each."""

    def __init__(self, tray):
        # A pop-up (override-redirect) window, like a menu: the window manager leaves it alone, so
        # pop-shell draws no focus border around it. It takes the keyboard with a grab instead of focus.
        super().__init__(type=Gtk.WindowType.POPUP)
        self.tray = tray
        self.show_done = False
        self.add_to_plan = False
        self.hidden_at = 0
        self.grabbed = False
        self.set_resizable(False)
        self.set_type_hint(Gdk.WindowTypeHint.POPUP_MENU)
        self.set_app_paintable(True)
        self.get_style_context().add_class('pv-panel')
        visual = self.get_screen().get_rgba_visual()
        if visual:
            self.set_visual(visual)  # lets the rounded, translucent panel show the desktop behind it
        self.connect('draw', self._clear)
        self.connect('key-press-event', lambda _w, e: self.hide() if e.keyval == Gdk.KEY_Escape else None)
        self.connect('button-press-event', self._click)
        self.connect('grab-broken-event', lambda *_: self.hide())
        self.connect('hide', self._on_hide)

        root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        root.get_style_context().add_class('panel')
        root.set_size_request(PANEL_W, -1)
        self.add(root)

        head = Gtk.Box(spacing=10)
        head.pack_start(Gtk.Image.new_from_pixbuf(GdkPixbuf.Pixbuf.new_from_file_at_size(ICON, 22, 22)), False, False, 0)
        titles = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        self.date = label('', 'date')
        titles.pack_start(self.date, False, False, 0)
        titles.pack_start(label('Todos', 'title'), False, False, 0)
        head.pack_start(titles, True, True, 0)
        self.count = label('', 'count', xalign=1)
        head.pack_end(self.count, False, False, 0)
        root.pack_start(head, False, False, 0)

        self.stack = Gtk.Stack()
        self.stack.set_vhomogeneous(False)
        self.stack.add_named(self._build_list(), 'list')
        self.stack.add_named(self._build_setup(), 'setup')
        root.pack_start(self.stack, False, False, 0)

        foot = Gtk.Box(spacing=8)
        self.status = label('', 'faint')
        self.status.set_ellipsize(3)
        foot.pack_start(self.status, True, True, 0)
        if tray.cfg.get('appUrl'):
            foot.pack_end(button('Open ProducTVT', 'link',
                                 on_click=lambda: (subprocess.Popen(['xdg-open', tray.cfg['appUrl'].rstrip('/') + '/todos']),
                                                   self.hide())), False, False, 0)
        root.pack_start(foot, False, False, 0)

    def _build_list(self):
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        add = Gtk.Box(spacing=6)
        add.get_style_context().add_class('add')
        self.entry = Gtk.Entry(placeholder_text='Add a todo…', max_length=300)
        self.entry.get_style_context().add_class('add-entry')
        self.entry.connect('activate', lambda _w: self._submit())
        self.entry.connect('focus-in-event', lambda *_: set_class(add, 'focus', True))
        self.entry.connect('focus-out-event', lambda *_: set_class(add, 'focus', False))
        add.pack_start(self.entry, True, True, 0)
        self.plan_new = button(calendar_icon(False), 'plan', on_click=self._toggle_new_plan)
        add.pack_end(self.plan_new, False, False, 0)
        self._toggle_new_plan(False)
        box.pack_start(add, False, False, 0)

        self.error = label('', 'error')
        self.error.set_line_wrap(True)
        self.error.set_no_show_all(True)
        box.pack_start(self.error, False, False, 0)

        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroll.set_propagate_natural_height(True)
        scroll.set_max_content_height(380)
        self.rows = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=1)
        scroll.add(self.rows)
        box.pack_start(scroll, False, False, 0)
        return box

    def _build_setup(self):
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        box.pack_start(label('Your ProducTVT username', 'muted'), False, False, 0)
        wrap = Gtk.Box()
        wrap.get_style_context().add_class('add')
        self.user_entry = Gtk.Entry(placeholder_text='e.g. chetak')
        self.user_entry.get_style_context().add_class('add-entry')
        self.user_entry.connect('activate', lambda _w: self.tray.connect_user(self.user_entry.get_text()))
        wrap.pack_start(self.user_entry, True, True, 0)
        box.pack_start(wrap, False, False, 0)
        self.setup_error = label('', 'error')
        self.setup_error.set_line_wrap(True)
        box.pack_start(self.setup_error, False, False, 0)
        box.pack_start(label('Press Enter to connect. The database login comes from ProductVT/.env.', 'faint'), False, False, 0)
        return box

    @staticmethod
    def _clear(_w, cr):
        cr.set_source_rgba(0, 0, 0, 0)
        cr.set_operator(1)  # cairo.OPERATOR_SOURCE: transparent corners outside the rounded panel
        cr.paint()
        cr.set_operator(2)  # OVER
        return False

    def toggle(self):
        if self.get_visible():
            self.hide()
            return
        # Clicking the top-bar icon while open first hides the panel (it's a click outside), then
        # toggles; that click meant "close", so don't reopen it.
        if time.monotonic() - self.hidden_at < 0.4:
            return
        self.tray.refresh()
        self.render()
        self.show_all()
        geo = Gdk.Display.get_default().get_monitor_at_window(self.get_window()).get_geometry()
        w, _ = self.get_size()
        self.move(geo.x + geo.width - w - 10, geo.y + 34)
        self._grab(20)

    def _grab(self, tries):
        """Takes the keyboard and mouse, as a menu does. Right after the hotkey or a click the shell
        may still hold them, so retry briefly."""
        if not self.get_visible():
            return False
        seat = Gdk.Display.get_default().get_default_seat()
        if seat.grab(self.get_window(), Gdk.SeatCapabilities.ALL, True, None, None, None) != Gdk.GrabStatus.SUCCESS:
            if tries:
                GLib.timeout_add(50, self._grab, tries - 1)
            return False
        self.grabbed = True  # (no Gtk grab_add on top: it swallows clicks on the panel's own buttons)
        # A pop-up never gets window focus, so tell it it has it: the entry then shows its cursor and takes typing.
        focus = Gdk.Event.new(Gdk.EventType.FOCUS_CHANGE)
        focus.focus_change.window = self.get_window()
        focus.focus_change.in_ = 1
        self.send_focus_change(focus)
        (self.entry if self.tray.uid else self.user_entry).grab_focus()
        return False

    def _click(self, _w, event):
        """With the grab, clicks anywhere arrive here; one outside the panel closes it."""
        x, y = self.get_position()
        w, h = self.get_size()
        if x <= event.x_root < x + w and y <= event.y_root < y + h:
            return False
        self.hide()
        return True

    def _on_hide(self, *_):
        self.hidden_at = time.monotonic()
        if self.grabbed:
            self.grabbed = False
            Gdk.Display.get_default().get_default_seat().ungrab()

    def _toggle_new_plan(self, value=None):
        self.add_to_plan = (not self.add_to_plan) if value is None else value
        set_class(self.plan_new, 'on', self.add_to_plan)
        self.plan_new.remove(self.plan_new.get_child())
        self.plan_new.add(calendar_icon(self.add_to_plan))
        self.plan_new.show_all()
        self.plan_new.set_tooltip_text('Will be added to this week\'s plan' if self.add_to_plan
                                       else 'Also add to this week\'s plan')
        self.entry.grab_focus()

    def _submit(self):
        title = self.entry.get_text().strip()
        if title:
            self.entry.set_text('')
            self.tray.add(title, self.add_to_plan)

    def show_error(self, msg):
        self.error.set_text(msg or '')
        self.error.set_visible(bool(msg))

    def render(self):
        t = self.tray
        self.date.set_text(time.strftime('%A %-d %b').upper())
        if not t.uid:
            self.stack.set_visible_child_name('setup')
            self.count.set_text('')
            self.setup_error.set_text(t.setup_error or '')
            self.status.set_text('')
            return
        self.stack.set_visible_child_name('list')

        todos = t.todos or []
        open_ = [x for x in todos if not x['done']]
        done = [x for x in todos if x['done']]
        planned = sum(1 for x in open_ if x['inPlan'])
        self.count.set_text('all clear' if not open_ else f'{len(open_)} left')
        if t.loading and t.todos is None:
            self.status.set_text('Loading…')
        elif t.pending:
            self.status.set_text('Saving…')
        elif t.synced:
            plan = f'{planned} on this week\'s plan · ' if planned else ''
            self.status.set_text(f'{plan}synced {time.strftime("%H:%M", time.localtime(t.synced))}')

        for child in self.rows.get_children():
            self.rows.remove(child)
        for x in open_:
            self.rows.pack_start(self._row(x), False, False, 0)
        if t.todos is not None and not open_:
            self.rows.pack_start(label('Nothing left. Type above to add one.', 'muted', xalign=0.5), False, False, 12)
        if done:
            fold = button(f'{"▾" if self.show_done else "▸"}  Done · {len(done)}', 'fold', on_click=self._toggle_done)
            fold.get_child().set_xalign(0)
            self.rows.pack_start(fold, False, False, 4)
            if self.show_done:
                for x in done[:DONE_SHOWN]:
                    self.rows.pack_start(self._row(x), False, False, 0)
        self.rows.show_all()

    def _toggle_done(self):
        self.show_done = not self.show_done
        self.render()

    def _row(self, x):
        row = Gtk.Box(spacing=10)
        row.get_style_context().add_class('row')
        saving = x['id'].startswith('temp-')

        check = button('✓' if x['done'] else '', 'check', tooltip='Mark as not done' if x['done'] else 'Mark as done',
                       on_click=lambda: self.tray.set_done(x, not x['done']))
        set_class(check, 'on', x['done'])
        check.set_valign(Gtk.Align.CENTER)
        check.set_size_request(18, 18)
        check.set_sensitive(not saving)
        row.pack_start(check, False, False, 0)

        title = label(x['title'], 'todo')
        set_class(title, 'done', x['done'])
        title.set_ellipsize(3)
        title.set_tooltip_text(x['title'])
        if x['done']:
            title.set_markup(f'<s>{GLib.markup_escape_text(x["title"])}</s>')
        if saving:
            title.set_opacity(0.6)
        row.pack_start(title, True, True, 0)

        if not x['done']:
            past = x.get('planWeek') and not x['inPlan']
            tip = ('On the plan through its project task' if x['planFromTask']
                   else 'Remove from this week\'s plan' if x['inPlan']
                   else f'On the plan for the week of {x["planWeek"].strftime("%-d %b")}: click to carry it over to this week'
                   if past else 'Add to this week\'s plan')
            plan = button(calendar_icon(x['inPlan']), 'plan', tooltip=tip, on_click=lambda: self.tray.set_plan(x, not x['inPlan']))
            set_class(plan, 'on', x['inPlan'])
            set_class(plan, 'past', bool(past) and not x['planFromTask'])
            plan.set_sensitive(not saving and not x['planFromTask'])
            row.pack_start(plan, False, False, 0)
        delete = button('✕', 'del', tooltip='Delete', on_click=lambda: self.tray.delete(x))
        delete.set_sensitive(not saving)
        row.pack_start(delete, False, False, 0)
        return row


class Tray(Gtk.Application):
    def __init__(self):
        super().__init__(application_id=APP_ID)
        self.cfg = load_config()
        self.store = None
        self.uid = None
        self.todos = None
        self.loading = False
        self.pending = 0
        self.synced = None
        self.setup_error = None
        self.worker = Worker()
        self.panel = None
        self.started = False

    def do_startup(self):
        Gtk.Application.do_startup(self)
        self.hold()  # keep running with the panel hidden
        provider = Gtk.CssProvider()
        provider.load_from_data(CSS)
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        toggle = Gio.SimpleAction.new('toggle', None)
        toggle.connect('activate', lambda *_: self.panel.toggle())
        self.add_action(toggle)  # the Super+Shift+T shortcut and the top-bar extension call this over D-Bus
        self.count = Gio.SimpleAction.new_stateful('count', None, GLib.Variant('i', 0))
        self.add_action(self.count)  # open todos, shown next to the extension's icon

        self.panel = Panel(self)
        self.ind = None
        self._use_extension(extension_active())
        Gio.bus_get_sync(Gio.BusType.SESSION).signal_subscribe(
            'org.gnome.Shell', 'org.gnome.Shell.Extensions', 'ExtensionStateChanged', '/org/gnome/Shell', None,
            Gio.DBusSignalFlags.NONE,
            lambda *_: GLib.timeout_add(500, lambda: self._use_extension(extension_active())))

        if self.cfg.get('username'):
            self.connect_user(self.cfg['username'])
        elif guess_username():
            self.connect_user(guess_username(), guessed=True)
        GLib.timeout_add_seconds(120, self.refresh)

    def _use_extension(self, on):
        """The extension's button replaces the AppIndicator icon while it's running."""
        if on and self.ind:
            self.ind.set_status(AppIndicator3.IndicatorStatus.PASSIVE)
        elif not on:
            if not self.ind:
                self._build_indicator()
            self.ind.set_status(AppIndicator3.IndicatorStatus.ACTIVE)

    def _build_indicator(self):
        """Fallback icon when the extension isn't on. AppIndicator always opens a menu on click."""
        self.ind = AppIndicator3.Indicator.new('productvt-tray', TRAY_ICON, AppIndicator3.IndicatorCategory.APPLICATION_STATUS)
        self.ind.set_status(AppIndicator3.IndicatorStatus.ACTIVE)
        self.ind.set_title('ProducTVT todos')
        menu = Gtk.Menu()
        open_item = Gtk.MenuItem(label='Open todos    Super+Shift+T')
        open_item.connect('activate', lambda _w: self.panel.toggle())
        menu.append(open_item)
        if self.cfg.get('appUrl'):
            app_item = Gtk.MenuItem(label='Open ProducTVT')
            app_item.connect('activate', lambda _w: subprocess.Popen(['xdg-open', self.cfg['appUrl']]))
            menu.append(app_item)
        menu.append(Gtk.SeparatorMenuItem())
        quit_item = Gtk.MenuItem(label='Hide icon')
        quit_item.connect('activate', lambda _w: self.quit())
        menu.append(quit_item)
        menu.show_all()
        self.ind.set_menu(menu)
        self.ind.set_secondary_activate_target(open_item)  # middle-click the icon opens the panel

    def do_activate(self):
        # Runs once when this copy starts, then each time the script is launched again;
        # those later launches toggle the panel of the copy already running.
        if self.started or '--panel' in sys.argv:
            self.panel.toggle()
        self.started = True

    # -- data --

    def connect_user(self, username, guessed=False):
        username = username.strip()
        if not username:
            return
        self.setup_error = None

        def find():
            if self.store is None:
                self.store = Store(self.cfg['env'])
            return self.store.user_id(username)

        def found(uid):
            if not uid:
                self.setup_error = None if guessed else f'No active user called "{username}".'
            else:
                self.uid = uid
                if self.cfg.get('username') != username:
                    self.cfg['username'] = username
                    save_config(self.cfg)
                self.refresh()
            self.panel.render()
            if self.uid and self.panel.get_visible():
                self.panel.entry.grab_focus()

        def failed(msg):
            self.setup_error = f'Can\'t reach the database: {msg}'
            self.panel.render()

        self.worker.submit(find, found, failed)

    def refresh(self):
        if not self.uid:
            return True
        self.loading = True
        uid = self.uid

        def loaded(todos):
            self.loading = False
            # A reply that started before a local change would undo it on screen; the next one won't.
            if not self.pending:
                self.todos = todos
                self.synced = time.time()
                open_count = sum(1 for x in todos if not x['done'])
                self.count.set_state(GLib.Variant('i', open_count))
                if self.ind:
                    self.ind.set_label(str(open_count) if open_count else '', '99')
            self.panel.render()

        def failed(msg):
            self.loading = False
            self.panel.show_error(f'Couldn\'t load: {msg}')

        self.worker.submit(lambda: self.store.todos(uid), loaded, failed)
        return True  # keep the timer going

    def _change(self, apply, call):
        """Shows the change right away, saves it in the background, then reloads."""
        if self.todos is None:
            return  # still loading
        apply()
        self.pending += 1
        self.panel.show_error(None)
        self.panel.render()

        def done(_=None):
            self.pending -= 1
            self.refresh()

        def failed(msg):
            self.panel.show_error(f'Couldn\'t save: {msg}')
            done()

        self.worker.submit(call, done, failed)

    def add(self, title, plan):
        uid = self.uid
        temp = {'id': f'temp-{time.time()}', 'title': title, 'done': False, 'inPlan': plan, 'planFromTask': False}
        self._change(lambda: self.todos.append(temp), lambda: self.store.add(uid, title, plan))

    def set_done(self, x, done):
        uid = self.uid
        self._change(lambda: x.update(done=done), lambda: self.store.set_done(uid, x['id'], done))

    def set_plan(self, x, on):
        uid = self.uid
        self._change(lambda: x.update(inPlan=on), lambda: self.store.set_plan(uid, x['id'], on))

    def delete(self, x):
        uid = self.uid
        self._change(lambda: self.todos.remove(x), lambda: self.store.delete(uid, x['id']))


if __name__ == '__main__':
    app = Tray()
    sys.exit(app.run([sys.argv[0]]))

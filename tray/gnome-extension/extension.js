// ProducTVT logo in the GNOME top bar: one click shows or hides the todo panel of
// tray/productvt-tray.py, and the label shows how many todos are left.
// Written for GNOME Shell 3.36 (GJS 1.64: no ?. or ??).
'use strict';

const {Clutter, Gio, GLib, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const APP = 'ai.biztel.productvt.tray';
const PATH = '/ai/biztel/productvt/tray';

let indicator = null;

// The tray script sits next to this folder in the repo; the extensions dir only holds a symlink to it.
function trayDir() {
    let dir = Me.path;
    try {
        dir = GLib.file_read_link(Me.path);
    } catch (e) {}
    return GLib.path_get_dirname(dir);
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.5, 'ProducTVT Todos', true); // no menu: a click opens the panel itself

        const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        box.add_child(new St.Icon({gicon: Gio.icon_new_for_string(`${Me.path}/logo-white.svg`), style_class: 'system-status-icon'}));
        this._label = new St.Label({text: '', y_align: Clutter.ActorAlign.CENTER, style_class: 'pv-label'});
        box.add_child(this._label);
        this.add_child(box);

        // The app publishes the open count as the state of its "count" action.
        this._sub = Gio.DBus.session.signal_subscribe(APP, 'org.gtk.Actions', 'Changed', PATH, null,
            Gio.DBusSignalFlags.NONE, (_c, _s, _p, _i, _n, params) => {
                const states = params.deep_unpack()[2];
                if (states.count) this._show(states.count.deep_unpack());
            });
        this._watch = Gio.bus_watch_name(Gio.BusType.SESSION, APP, Gio.BusNameWatcherFlags.NONE,
            () => this._fetchCount(), () => this._show(0));
    }

    _fetchCount() {
        Gio.DBus.session.call(APP, PATH, 'org.gtk.Actions', 'Describe', new GLib.Variant('(s)', ['count']),
            null, Gio.DBusCallFlags.NONE, -1, null, (conn, res) => {
                try {
                    const state = conn.call_finish(res).deep_unpack()[0][2];
                    if (state.length) this._show(state[0].deep_unpack());
                } catch (e) {}
            });
    }

    _show(count) {
        this._label.text = count ? String(count) : '';
    }

    vfunc_event(event) {
        if (event.type() === Clutter.EventType.BUTTON_PRESS || event.type() === Clutter.EventType.TOUCH_BEGIN) {
            this._toggle();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _toggle() {
        Gio.DBus.session.call(APP, PATH, 'org.gtk.Actions', 'Activate',
            new GLib.Variant('(sava{sv})', ['toggle', [], {}]), null, Gio.DBusCallFlags.NONE, -1, null,
            (conn, res) => {
                try {
                    conn.call_finish(res);
                } catch (e) { // not running yet: start it with the panel open
                    GLib.spawn_command_line_async(`/usr/bin/python3 ${GLib.shell_quote(`${trayDir()}/productvt-tray.py`)} --panel`);
                }
            });
    }

    _onDestroy() {
        Gio.DBus.session.signal_unsubscribe(this._sub);
        Gio.bus_unwatch_name(this._watch);
        super._onDestroy();
    }
});

function init() {}

function enable() {
    indicator = new Indicator();
    Main.panel.addToStatusArea('productvt-todos', indicator, 0, 'right');
}

function disable() {
    if (indicator) indicator.destroy();
    indicator = null;
}

#!/bin/sh
# Bound to Super+Shift+T: shows/hides the panel of the running tray app, or starts it with the panel open.
gdbus call --session --dest ai.biztel.productvt.tray --object-path /ai/biztel/productvt/tray \
  --method org.gtk.Actions.Activate toggle "[]" "{}" >/dev/null 2>&1 \
  || exec /usr/bin/python3 "$(dirname "$(readlink -f "$0")")/productvt-tray.py" --panel

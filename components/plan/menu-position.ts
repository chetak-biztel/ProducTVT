/** Shared viewport-aware placement for the PillSelect / MultiPillSelect dropdown portals. */

const GAP = 6;
const EDGE_PAD = 8;
const MAX_MENU_HEIGHT = 256; // matches the menu's max-h-64
const MIN_MENU_HEIGHT = 120;

export type MenuPos = { top?: number; bottom?: number; left: number; width: number; maxHeight: number };

/** Anchors the menu below its trigger, flipping above when there isn't room, and always
    clamps its height/width to the viewport so it can never render off-screen or hidden. */
export function placeMenu(rect: { top: number; bottom: number; left: number; width: number }): MenuPos {
  const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE_PAD;
  const spaceAbove = rect.top - GAP - EDGE_PAD;
  const openUp = spaceBelow < MAX_MENU_HEIGHT && spaceAbove > spaceBelow;
  const maxHeight = Math.max(MIN_MENU_HEIGHT, Math.min(MAX_MENU_HEIGHT, openUp ? spaceAbove : spaceBelow));
  const width = Math.max(rect.width, 180);
  const left = Math.min(Math.max(EDGE_PAD, rect.left), window.innerWidth - width - EDGE_PAD);

  return {
    left,
    width,
    maxHeight,
    ...(openUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
  };
}

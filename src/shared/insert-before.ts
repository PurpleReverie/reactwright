// Reorder a list so `child` sits immediately before `beforeChild`.
// If `child` is already present, it is removed first. If `beforeChild`
// is not present, `child` is appended. Mutates `items` in place.
//
// Used by the React reconcilers to honour `insertBefore` calls on
// container children. The content and template reconcilers both need
// the same logic; this is the shared source of truth.
export function insertBeforeInList<T>(items: T[], child: T, beforeChild: T): void {
  const existingIndex = items.indexOf(child);
  if (existingIndex >= 0) {
    items.splice(existingIndex, 1);
  }

  const beforeIndex = items.indexOf(beforeChild);
  if (beforeIndex === -1) {
    items.push(child);
    return;
  }

  items.splice(beforeIndex, 0, child);
}

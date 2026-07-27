export type RowMoveDirection = -1 | 1;

export function moveRow<T extends { id: string }>(
  items: T[],
  id: string,
  direction: RowMoveDirection,
): T[] {
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const next = [...items];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}

export function setRowLocked<T extends { id: string; locked?: boolean }>(
  items: T[],
  id: string,
  locked: boolean,
): T[] {
  const target = items.find((item) => item.id === id);
  if (!target || Boolean(target.locked) === locked) return items;

  return items.map((item) => {
    if (item.id !== id) return item;
    if (locked) return { ...item, locked: true };

    const { locked: _locked, ...unlockedItem } = item;
    return unlockedItem as T;
  });
}
